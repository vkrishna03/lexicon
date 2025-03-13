import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCandidates, getElection, nominateCandidate } from '../services/electionService';

function Nominate({ wallet }) {
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch election details
        const electionData = await getElection(electionId);
        setElection(electionData);
        
        // Check if election is in nomination phase
        const now = new Date();
        const nominationEnd = new Date(electionData.nominationEndDate);
        
        if (now > nominationEnd) {
          setError('Nomination period has ended for this election');
        }
        
        // Fetch existing candidates
        const candidateData = await getCandidates(electionId);
        setCandidates(candidateData);
      } catch (err) {
        setError('Failed to load election details: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [electionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Check if user is already a candidate
      const isAlreadyCandidate = candidates.some(
        candidate => candidate.address.toLowerCase() === wallet.toLowerCase()
      );
      
      if (isAlreadyCandidate) {
        setError('You are already nominated for this election');
        setSubmitting(false);
        return;
      }
      
      await nominateCandidate(electionId, {
        ...formData,
        address: wallet,
        voteCount: 0 // Initialize with zero votes
      });
      
      // Refresh candidates list
      const updatedCandidates = await getCandidates(electionId);
      setCandidates(updatedCandidates);
      
      // Reset form
      setFormData({
        name: '',
        platform: ''
      });
      
    } catch (err) {
      setError('Failed to submit nomination: ' + err.message);
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
      </div>
    );
  }

  if (!election) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Election not found</p>
        <Link to="/elections" className="text-blue-500 hover:underline mt-4 inline-block">
          Return to Elections
        </Link>
      </div>
    );
  }

  const now = new Date();
  const nominationEnd = new Date(election.nominationEndDate);
  const isNominationActive = now <= nominationEnd;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/elections" className="text-blue-500 hover:underline">&larr; Back to Elections</Link>
      </div>
      
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">{election.title}</h1>
        <p className="text-gray-600 mb-4">{election.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <span className="font-medium">Nomination Period:</span> {new Date(election.startDate).toLocaleString()} - {new Date(election.nominationEndDate).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Voting Period:</span> {new Date(election.nominationEndDate).toLocaleString()} - {new Date(election.endDate).toLocaleString()}
          </div>
        </div>
        
        <div className={`text-sm font-bold px-3 py-1 rounded inline-block ${isNominationActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isNominationActive ? 'Nomination Active' : 'Nomination Closed'}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {isNominationActive && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Submit Your Nomination</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="name">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2" htmlFor="platform">
                Your Platform/Manifesto
              </label>
              <textarea
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
            >
              {submitting ? 'Submitting...' : 'Submit Nomination'}
            </button>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Current Candidates ({candidates.length})</h2>
        
        {candidates.length === 0 ? (
          <p className="text-gray-600">No candidates have been nominated yet.</p>
        ) : (
          <div className="grid gap-4">
            {candidates.map((candidate, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-1">{candidate.name}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {candidate.address.substring(0, 6)}...{candidate.address.substring(candidate.address.length - 4)}
                </p>
                <p className="text-gray-700">{candidate.platform}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Nominate;