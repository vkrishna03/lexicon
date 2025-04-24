import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useVoting } from "../contexts/useVoting";
import { contractManager } from "../utils/contractUtils";

function Vote() {
  const { account, getElection, getCandidates, castVote } = useVoting();
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVotingActive, setIsVotingActive] = useState(false);
  const [electionPhase, setElectionPhase] = useState("");
  const [debug, setDebug] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        setDebug((prev) => ({ ...prev, stage: "Fetching election data" }));

        // First update the election state on the blockchain
        await contractManager.updateElectionState(electionId);

        // Then fetch the election details
        const electionData = await getElection(electionId);
        setDebug((prev) => ({ ...prev, electionData }));

        if (!electionData) {
          setError(`Election with ID ${electionId} not found`);
          setLoading(false);
          return;
        }

        // Format the election data for the UI
        const formattedElection = {
          id: electionData.id,
          title: electionData.name,
          description: electionData.description,
          nominationStart: electionData.nominationStart,
          nominationEnd: electionData.nominationEnd,
          votingStart: electionData.votingStart,
          votingEnd: electionData.votingEnd,
          state: electionData.state,
          timeStatus: electionData.timeStatus,
        };

        setElection(formattedElection);

        // Get the current time and determine the election phase
        const now = new Date();
        const votingStartTime = new Date(electionData.votingStart);
        const votingEndTime = new Date(electionData.votingEnd);

        // Determine if voting is active based on current time
        const votingTimeActive = now >= votingStartTime && now <= votingEndTime;

        // Get the phase from the timeStatus
        const phase = electionData.timeStatus.phase;
        setElectionPhase(phase);

        // Set voting active if both time and phase align
        setIsVotingActive(
          phase.includes("Voting period active") && votingTimeActive,
        );

        // Log for debugging
        console.log("Current time:", now);
        console.log("Voting start:", votingStartTime);
        console.log("Voting end:", votingEndTime);
        console.log("Voting time active:", votingTimeActive);
        console.log("Election phase:", phase);
        console.log("Is voting active:", isVotingActive);

        // Set an appropriate error message based on phase
        if (!phase.includes("Voting period active")) {
          if (phase.includes("Nomination")) {
            setError(
              "Voting has not started yet. The election is still in the nomination phase.",
            );
          } else if (phase.includes("ended")) {
            setError("Voting has ended for this election.");
          } else if (phase.includes("Waiting for voting")) {
            setError("Voting will start soon. Please check back later.");
          } else {
            setError(phase); // Show the actual phase message
          }
        }

        // Fetch candidates
        setDebug((prev) => ({ ...prev, stage: "Fetching candidates" }));
        const candidateData = await getCandidates(electionId);
        setCandidates(candidateData);

        // Check if user has already voted
        if (account) {
          const hasVoted = await contractManager.hasUserVoted(
            electionId,
            account,
          );
          setAlreadyVoted(hasVoted);

          if (hasVoted) {
            console.log("User has already voted");
          }
        }
      } catch (err) {
        console.error("Vote page error:", err);
        setError("Failed to load election details: " + err.message);
        setDebug((prev) => ({ ...prev, error: err.message }));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [electionId, account, getElection, getCandidates]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError("Please select a candidate");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Find the candidate's ID from the selected address
      const candidateId = candidates.find(
        (c) => c.address === selectedCandidate,
      )?.id;

      if (!candidateId) {
        throw new Error("Invalid candidate selection");
      }

      console.log("Casting vote for candidate ID:", candidateId);

      // Cast the vote
      await castVote(electionId, candidateId);
      setSuccess("Your vote has been recorded successfully!");
      setAlreadyVoted(true);
    } catch (err) {
      setError("Failed to cast vote: " + err.message);
      console.error("Voting error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner"></div>
        <p>Loading election details...</p>
        <div className="mt-4 text-sm text-gray-500">
          <pre className="text-xs text-left max-w-lg mx-auto bg-gray-100 p-2 rounded">
            Debug: {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Election not found</p>
        <div className="mt-4 text-sm text-gray-500">
          <pre className="text-xs text-left max-w-lg mx-auto bg-gray-100 p-2 rounded">
            Debug: {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
        <Link
          to="/elections"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          Return to Elections
        </Link>
      </div>
    );
  }

  // Determine if we should show voting UI, already voted message, or voting unavailable
  const showVotingUI = isVotingActive && !alreadyVoted;
  const showAlreadyVotedMessage = isVotingActive && alreadyVoted;
  const showVotingUnavailable = !isVotingActive;

  // Helper function to determine the correct message for voting unavailable
  const getVotingUnavailableMessage = () => {
    const now = new Date();
    const nominationEnd = new Date(election.nominationEnd);
    const votingStart = new Date(election.votingStart);
    const votingEnd = new Date(election.votingEnd);

    if (now < nominationEnd) {
      return "Voting has not started yet. The election is still in the nomination phase.";
    } else if (now < votingStart) {
      return "Nomination period has ended. Voting will begin soon.";
    } else if (now > votingEnd) {
      return "The voting period for this election has ended.";
    } else {
      return "Voting is currently unavailable.";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/elections" className="text-blue-500 hover:underline">
          &larr; Back to Elections
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{election.title}</h1>
        <p className="text-gray-600 mb-4">{election.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <span className="font-medium">Nomination Period:</span>{" "}
            {new Date(election.nominationStart).toLocaleString()} -{" "}
            {new Date(election.nominationEnd).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Voting Period:</span>{" "}
            {new Date(election.votingStart).toLocaleString()} -{" "}
            {new Date(election.votingEnd).toLocaleString()}
          </div>
        </div>

        <div
          className={`text-sm font-bold px-3 py-1 rounded inline-block ${
            isVotingActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isVotingActive ? "Voting Active" : "Voting Inactive"}
        </div>

        <div className="mt-4">
          <Link
            to={`/results/${electionId}`}
            className="text-blue-500 hover:underline"
          >
            View Current Results
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {showVotingUI && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>

          {candidates.length === 0 ? (
            <p className="text-gray-600">
              No candidates are available for this election.
            </p>
          ) : (
            <div>
              <div className="mb-6">
                <p className="mb-2 font-medium">Select a candidate:</p>
                {candidates.map((candidate, index) => (
                  <div key={index} className="mb-2">
                    <label className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="candidate"
                        value={candidate.address}
                        checked={selectedCandidate === candidate.address}
                        onChange={() => setSelectedCandidate(candidate.address)}
                        className="mr-2"
                      />
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-sm text-gray-500">
                          {candidate.address.substring(0, 6)}...
                          {candidate.address.substring(
                            candidate.address.length - 4,
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={handleVote}
                disabled={submitting || !selectedCandidate}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded disabled:bg-purple-300"
              >
                {submitting ? "Casting Vote..." : "Cast Vote"}
              </button>
            </div>
          )}
        </div>
      )}

      {showAlreadyVotedMessage && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">You Have Voted</h2>
          <p className="text-gray-600">
            You have already cast your vote for this election. You can view the
            results using the link above.
          </p>
        </div>
      )}

      {showVotingUnavailable && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Voting Unavailable</h2>
          <p className="text-gray-600">{getVotingUnavailableMessage()}</p>
          <div className="mt-4">
            <Link
              to={`/results/${electionId}`}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded inline-block"
            >
              View Results
            </Link>
          </div>
        </div>
      )}

      <div className="bg-gray-100 rounded-lg p-4 mb-8 text-xs">
        <h3 className="font-bold mb-2">Debug Information</h3>
        <p>
          <strong>Current Phase:</strong> {electionPhase}
        </p>
        <p>
          <strong>Voting Active:</strong> {isVotingActive ? "Yes" : "No"}
        </p>
        <p>
          <strong>Already Voted:</strong> {alreadyVoted ? "Yes" : "No"}
        </p>
      </div>
    </div>
  );
}

export default Vote;
