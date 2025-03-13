import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getElections } from '../services/electionService';

function ElectionList() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchElections() {
      try {
        const electionData = await getElections();
        setElections(electionData);
      } catch (err) {
        setError('Failed to load elections: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchElections();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner"></div>
        <p>Loading elections...</p>
      </div>
    );
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
          {error}
        </div>
      )}

      {elections.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">No elections are currently available.</p>
          <p className="mt-2">Be the first to create an election!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map(election => (
            <div key={election.id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">{election.title}</h2>
              <p className="text-gray-600 mb-2">{election.description}</p>
              
              <div className="mt-4">
                <p><span className="font-medium">Status:</span> {election.status}</p>
                <p><span className="font-medium">Start:</span> {new Date(election.startDate).toLocaleString()}</p>
                <p><span className="font-medium">End:</span> {new Date(election.endDate).toLocaleString()}</p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2">
                {election.status === 'Nomination' && (
                  <Link 
                    to={`/nominate/${election.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded"
                  >
                    Nominate
                  </Link>
                )}
                
                {election.status === 'Voting' && (
                  <Link 
                    to={`/vote/${election.id}`}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-2 px-3 rounded"
                  >
                    Vote
                  </Link>
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