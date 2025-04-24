import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useVoting } from "../contexts/useVoting";

function ElectionList() {
  const { getElections } = useVoting();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debug] = useState({});

  useEffect(() => {
    async function fetchElections() {
      try {
        setLoading(true);
        const electionData = await getElections();
        setElections(electionData);
      } catch (err) {
        setError("Failed to load elections: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchElections();
  }, [getElections]);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner"></div>
        <p>Loading elections...</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Debug info:</p>
          <pre className="text-xs text-left max-w-lg mx-auto overflow-auto bg-gray-100 p-2 rounded">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (error) {
    return <>error...</>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Elections</h1>
        <Link
          to="/create-election"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Create New Election
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <div className="mt-2">
            <p className="text-sm">Debug info:</p>
            <pre className="text-xs overflow-auto bg-red-50 p-2 rounded mt-1">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {elections.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">No elections are currently available.</p>
          <p className="mt-2">Create your first election!</p>
          <Link
            to="/create-election"
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Create Election
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <div key={election.id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">{election.title}</h2>
              <p className="text-gray-600 mb-2">{election.description}</p>

              <div className="mt-4">
                <p>
                  <span className="font-medium">Status:</span> {election.status}
                </p>
                <p>
                  <span className="font-medium">Start:</span>{" "}
                  {new Date(election.startDate).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">End:</span>{" "}
                  {new Date(election.endDate).toLocaleString()}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {election.status === "Active" && (
                  <>
                    <Link
                      to={`/nominate/${election.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded"
                    >
                      Nominate
                    </Link>
                    <Link
                      to={`/vote/${election.id}`}
                      className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-2 px-3 rounded"
                    >
                      Vote
                    </Link>
                  </>
                )}

                <Link
                  to={`/results/${election.id}`}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold py-2 px-3 rounded"
                >
                  View Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ElectionList;
