import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useVoting } from "../contexts/useVoting";

function CreateElection() {
  const { account, createElection } = useVoting();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    nominationStart: "",
    nominationEnd: "",
    votingStart: "",
    votingEnd: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    // Validate dates
    const nominationStart = new Date(formData.nominationStart);
    const nominationEnd = new Date(formData.nominationEnd);
    const votingStart = new Date(formData.votingStart);
    const votingEnd = new Date(formData.votingEnd);

    if (nominationEnd <= nominationStart) {
      setError("Nomination end date must be after nomination start date");
      setLoading(false);
      return;
    }

    if (votingStart <= nominationEnd) {
      setError("Voting start date must be after nomination end date");
      setLoading(false);
      return;
    }

    if (votingEnd <= votingStart) {
      setError("Voting end date must be after voting start date");
      setLoading(false);
      return;
    }

    try {
      await createElection(formData);
      navigate("/elections");
    } catch (err) {
      setError("Failed to create election: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-10">
        <p>Please connect your wallet to create an election</p>
        <Link
          to="/"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          Connect Wallet
        </Link>
      </div>
    );
  }

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
          <label className="block text-gray-700 font-bold mb-2" htmlFor="name">
            Election Name
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

        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="description"
          >
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="nominationStart"
            >
              Nomination Start Date
            </label>
            <input
              type="datetime-local"
              id="nominationStart"
              name="nominationStart"
              value={formData.nominationStart}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="nominationEnd"
            >
              Nomination End Date
            </label>
            <input
              type="datetime-local"
              id="nominationEnd"
              name="nominationEnd"
              value={formData.nominationEnd}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="votingStart"
            >
              Voting Start Date
            </label>
            <input
              type="datetime-local"
              id="votingStart"
              name="votingStart"
              value={formData.votingStart}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div>
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="votingEnd"
            >
              Voting End Date
            </label>
            <input
              type="datetime-local"
              id="votingEnd"
              name="votingEnd"
              value={formData.votingEnd}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate("/elections")}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
          >
            {loading ? "Creating..." : "Create Election"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateElection;
