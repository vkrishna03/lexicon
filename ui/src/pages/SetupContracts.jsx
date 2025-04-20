import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { Link } from "react-router-dom";

function SetupContracts() {
  const { setContractAddresses, currentAddresses } = useWeb3();
  const [tokenAddress, setTokenAddress] = useState(
    currentAddresses.votingToken || "",
  );
  const [votingAddress, setVotingAddress] = useState(
    currentAddresses.tokenVoting || "",
  );
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!tokenAddress || !votingAddress) {
        setError("Both addresses are required");
        return;
      }

      setContractAddresses(tokenAddress, votingAddress);
      setSuccess("Contract addresses saved successfully!");

      // Clear any previous error
      setError("");
    } catch (err) {
      setError("Failed to save addresses: " + err.message);
      console.error(err);
    }
  };

  const handleUseHardcodedAddresses = () => {
    // These are the typical addresses for the first two contracts deployed on Hardhat
    const hardcodedAddresses = {
      votingToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      tokenVoting: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    };

    setTokenAddress(hardcodedAddresses.votingToken);
    setVotingAddress(hardcodedAddresses.tokenVoting);
    setContractAddresses(
      hardcodedAddresses.votingToken,
      hardcodedAddresses.tokenVoting,
    );
    setSuccess("Using default Hardhat addresses!");
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-xl font-bold mb-4">Setup Contract Addresses</h2>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium mb-2">{success}</p>
          <Link
            to="/"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full block text-center"
          >
            Return to Connect Wallet
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 font-medium mb-2">
          Use default Hardhat addresses:
        </p>
        <button
          onClick={handleUseHardcodedAddresses}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          Use Default Addresses
        </button>
      </div>

      <p className="mb-4 text-gray-600">
        Or manually enter the addresses of your deployed contracts:
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="tokenAddress"
          >
            VotingToken Address
          </label>
          <input
            type="text"
            id="tokenAddress"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0x..."
            required
          />
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="votingAddress"
          >
            TokenVoting Address
          </label>
          <input
            type="text"
            id="votingAddress"
            value={votingAddress}
            onChange={(e) => setVotingAddress(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0x..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Save Contract Addresses
        </button>
      </form>

      <div className="mt-6 border-t pt-4">
        <h3 className="font-medium text-gray-700 mb-2">
          Current Contract Setup:
        </h3>
        <p className="text-sm text-gray-600">
          VotingToken: {currentAddresses.votingToken || "Not set"}
        </p>
        <p className="text-sm text-gray-600">
          TokenVoting: {currentAddresses.tokenVoting || "Not set"}
        </p>
      </div>
    </div>
  );
}

export default SetupContracts;
