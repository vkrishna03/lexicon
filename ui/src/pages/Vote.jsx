import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import {
  castVote,
  getCandidates,
  getElection,
  hasVoted,
} from "../services/blockchainService";

function Vote() {
  const { account, contracts } = useWeb3();
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debug, setDebug] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!contracts || !contracts.tokenVoting) {
          setError("Please connect your wallet and set up contracts first");
          setLoading(false);
          return;
        }

        setDebug((prev) => ({ ...prev, stage: "Fetching election" }));

        // Fetch election details
        const electionData = await getElection(
          contracts.tokenVoting,
          electionId,
        );
        setDebug((prev) => ({ ...prev, electionData }));

        if (!electionData) {
          setError(`Election with ID ${electionId} not found`);
          setLoading(false);
          return;
        }

        setElection(electionData);

        // Check if election is in voting phase
        const now = new Date();
        const nominationEnd = new Date(electionData.nominationEndDate);
        const electionEnd = new Date(electionData.endDate);

        if (now < nominationEnd) {
          setError(
            "Voting has not started yet. Election is still in nomination phase.",
          );
        } else if (now > electionEnd) {
          setError("Voting period has ended for this election");
        }

        setDebug((prev) => ({ ...prev, stage: "Fetching candidates" }));

        // Fetch candidates
        const candidateData = await getCandidates(
          contracts.tokenVoting,
          electionId,
        );
        setDebug((prev) => ({ ...prev, candidateData }));
        setCandidates(candidateData);

        if (account) {
          setDebug((prev) => ({ ...prev, stage: "Checking voting status" }));
          // Check if user has already voted
          try {
            const votedStatus = await hasVoted(
              contracts.tokenVoting,
              electionId,
              account,
            );
            setDebug((prev) => ({ ...prev, votedStatus }));
            setAlreadyVoted(votedStatus);
          } catch (votedErr) {
            console.warn("Error checking voted status:", votedErr);
            setDebug((prev) => ({ ...prev, votedError: votedErr.message }));
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
  }, [electionId, contracts, account]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError("Please select a candidate");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!contracts || !contracts.tokenVoting) {
        throw new Error("Contracts not initialized");
      }

      // Extract the candidate ID from the selected candidate
      const candidateId = candidates.find(
        (c) => c.address === selectedCandidate,
      )?.id;

      if (!candidateId) {
        throw new Error("Invalid candidate selection");
      }

      // Cast vote by candidate ID
      await castVote(contracts.tokenVoting, electionId, candidateId);
      setSuccess("Your vote has been recorded successfully!");
      setAlreadyVoted(true);
    } catch (err) {
      setError("Failed to cast vote: " + err.message);
      console.error(err);
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
  const now = new Date();
  const nominationEnd = new Date(election.nominationEndDate);
  const electionEnd = new Date(election.endDate);
  const isVotingActive = now >= nominationEnd && now <= electionEnd;

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
            <span className="font-medium">Voting Period:</span>{" "}
            {new Date(election.nominationEndDate).toLocaleString()} -{" "}
            {new Date(election.endDate).toLocaleString()}
          </div>
        </div>

        <div
          className={`text-sm font-bold px-3 py-1 rounded inline-block ${isVotingActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
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

      {isVotingActive && !alreadyVoted ? (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>

          {candidates.length === 0 ? (
            <p className="text-gray-600">
              No candidates are available for this election.
            </p>
          ) : (
            <>
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
            </>
          )}
        </div>
      ) : isVotingActive && alreadyVoted ? (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">You Have Voted</h2>
          // src/pages/Vote.js (continued)
          <p className="text-gray-600">
            You have already cast your vote for this election. You can view the
            results using the link above.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Voting Unavailable</h2>
          <p className="text-gray-600">
            {now < nominationEnd
              ? "Voting has not started yet. The election is still in the nomination phase."
              : "The voting period for this election has ended."}
          </p>
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
    </div>
  );
}

export default Vote;
