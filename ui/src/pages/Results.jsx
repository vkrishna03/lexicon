import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useVoting } from "../contexts/useVoting";

function Results() {
  const { getElection, getResults, getCandidates } = useVoting();
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState({});

  
    // Add this helper function at the top of the fileconst formatVoteCount = (count) => {
      const formatVoteCount = (count) => {
        if (!count) return "0";
        // Convert BigInt to string before formatting
        const tokens = ethers.formatEther(count.toString());
        return Number(tokens).toLocaleString('en-US', {
          maximumFractionDigits: 0
        });
      };
      
      const calculatePercentage = (count, total) => {
        if (!total || total === BigInt(0)) return 0;
        try {
          // Convert to BigInt for calculation
          const countBig = BigInt(count.toString());
          const totalBig = BigInt(total.toString());
          // Multiply by 100 first to maintain precision
          return Number((countBig * BigInt(100)) / totalBig);
        } catch (err) {
          console.error("Error calculating percentage:", err);
          return 0;
        }
      };
  useEffect(() => {
    async function fetchData() {
      try {
        setDebug((prev) => ({ ...prev, stage: "Fetching election" }));

        // Fetch election details
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
          nominationEndDate: electionData.nominationEnd,
          endDate: electionData.votingEnd,
          state: electionData.state,
          totalVotes: electionData.totalVotes,
        };

        setElection(formattedElection);

        // Fetch candidates
        const candidateData = await getCandidates(electionId);

        // Sort candidates by vote count in descending order
        const sortedCandidates = candidateData.sort(
          (a, b) => Number(b.voteCount) - Number(a.voteCount),
        );

        setCandidates(sortedCandidates);
      } catch (err) {
        console.error("Results page error:", err);
        setError("Failed to load election results: " + err.message);
        setDebug((prev) => ({ ...prev, error: err.message }));
      } finally {
        setLoading(false);
      }
    }


    fetchData();
  }, [electionId, getElection, getCandidates]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner"></div>
        <p>Loading election results...</p>
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

  // Calculate total votes
  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + BigInt(candidate.voteCount),
    BigInt(0)
  );

  // Calculate if election is completed
  const now = new Date();
  const electionEnd = new Date(election.endDate);
  const isElectionCompleted = now > electionEnd;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/elections" className="text-blue-500 hover:underline">
          &larr; Back to Elections
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{election.title} - Results</h1>
        <p className="text-gray-600 mb-4">{election.description}</p>

        <div className="mb-4">
          <span className="font-medium">Status:</span>
          <span
            className={`ml-2 text-sm font-bold px-3 py-1 rounded ${isElectionCompleted ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
          >
            {isElectionCompleted ? "Completed" : "In Progress"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <span className="font-medium">Voting Period:</span>{" "}
            {new Date(election.nominationEndDate).toLocaleString()} -{" "}
            {new Date(election.endDate).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Total Votes Cast:</span> {formatVoteCount(totalVotes)}
          </div>
        </div>

        {!isElectionCompleted && (
          <p className="text-sm text-yellow-600 mb-4">
            Note: The election is still in progress. Results may change as more
            votes are cast.
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Election Results</h2>

        {candidates.length === 0 ? (
          <p className="text-gray-600">
            No candidates have been nominated for this election.
          </p>
        ) : (
          <>
            {/* Winner banner if election completed */}
            {isElectionCompleted && candidates.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-green-800">Winner</h3>
                <p className="text-green-700 font-medium text-xl">
                  {candidates[0].name}
                </p>
                <p className="text-green-600">
                  {formatVoteCount(candidates[0].voteCount)} votes (
                  {calculatePercentage(candidates[0].voteCount, totalVotes)}%)
                </p>
              </div>
            )}

            {/* All candidates with vote bars */}
            <div className="space-y-6">
            {candidates.map((candidate, index) => {
              const voteCount = BigInt(candidate.voteCount);
              const percentage = calculatePercentage(voteCount, totalVotes);

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">
                        {candidate.name}
                      </h3>
                      <div className="text-gray-700 font-medium">
                        {formatVoteCount(voteCount)} votes ({percentage}%)
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div
                        className={`${index === 0 ? "bg-green-500" : "bg-blue-500"} h-4 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <p className="text-sm text-gray-500 mb-2">
                      {candidate.address.substring(0, 6)}...
                      {candidate.address.substring(
                        candidate.address.length - 4,
                      )}
                    </p>

                    <p className="text-gray-700 text-sm">
                      {candidate.platform}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Results;
