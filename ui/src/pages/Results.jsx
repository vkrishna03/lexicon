import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCandidates, getElection } from "../services/blockchainService";

function Results() {
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch election details
        const electionData = await getElection(electionId);
        setElection(electionData);

        // Fetch candidates with vote counts
        const candidateData = await getCandidates(electionId);

        // Sort candidates by vote count in descending order
        const sortedCandidates = candidateData.sort(
          (a, b) => b.voteCount - a.voteCount,
        );
        setCandidates(sortedCandidates);
      } catch (err) {
        setError("Failed to load election results: " + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [electionId]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner"></div>
        <p>Loading election results...</p>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Election not found</p>
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
    (sum, candidate) => sum + candidate.voteCount,
    0,
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
            <span className="font-medium">Total Votes Cast:</span> {totalVotes}
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
                  {candidates[0].voteCount} votes (
                  {totalVotes > 0
                    ? Math.round((candidates[0].voteCount / totalVotes) * 100)
                    : 0}
                  %)
                </p>
              </div>
            )}

            {/* All candidates with vote bars */}
            <div className="space-y-6">
              {candidates.map((candidate, index) => {
                const percentage =
                  totalVotes > 0
                    ? Math.round((candidate.voteCount / totalVotes) * 100)
                    : 0;

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">
                        {candidate.name}
                      </h3>
                      <div className="text-gray-700 font-medium">
                        {candidate.voteCount} votes ({percentage}%)
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
