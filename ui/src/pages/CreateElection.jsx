import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createElection } from '../services/electionService';

function CreateElection({ wallet }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    nominationEndDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate dates
    const start = new Date(formData.startDate);
    const nomEnd = new Date(formData.nominationEndDate);
    const end = new Date(formData.endDate);

    if (nomEnd <= start) {
      setError('Nomination end date must be after start date');
      setLoading(false);
      return;
    }

    if (end <= nomEnd) {
      setError('Election end date must be after nomination end date');
      setLoading(false);
      return;
    }

    try {
      await createElection({
        ...formData,
        creator: wallet
      });
      
      navigate('/elections');
    } catch (err) {
      setError('Failed to create election: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Create a New Election</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="title">
            Election Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="startDate">
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="nominationEndDate">
              Nomination End Date
            </label>
            <input
              type="datetime-local"
              id="nominationEndDate"
              name="nominationEndDate"
              value={formData.nominationEndDate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="endDate">
            Election End Date
          </label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/elections')}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
          >
            {loading ? 'Creating...' : 'Create Election'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateElection;