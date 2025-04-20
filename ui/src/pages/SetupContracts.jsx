import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";

function SetupContracts() {
  const { setContractAddresses } = useWeb3();
  const [tokenAddress, setTokenAddress] = useState("");
  const [votingAddress, setVotingAddress] = useState("");
  const [hasAddressFile, setHasAddressFile] = useState(false);
  const [addressFileContent, setAddressFileContent] = useState(null);

  useEffect(() => {
    // Try to load the addresses from the generated file
    const loadAddresses = async () => {
      try {
        const response = await fetch("/src/contractAddresses.json");
        if (response.ok) {
          const data = await response.json();
          setAddressFileContent(data);
          setHasAddressFile(true);

          if (data.votingToken) setTokenAddress(data.votingToken);
          if (data.tokenVoting) setVotingAddress(data.tokenVoting);
        }
      } catch (error) {
        console.log("No contract addresses file found, using manual entry");
      }
    };

    loadAddresses();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tokenAddress && votingAddress) {
      setContractAddresses(tokenAddress, votingAddress);
    }
  };

  const useGeneratedAddresses = () => {
    if (addressFileContent) {
      setTokenAddress(addressFileContent.votingToken);
      setVotingAddress(addressFileContent.tokenVoting);
      setContractAddresses(
        addressFileContent.votingToken,
        addressFileContent.tokenVoting,
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-xl font-bold mb-4">Setup Contract Addresses</h2>

      {hasAddressFile && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium mb-2">
            Deployed contract addresses detected!
          </p>
          <button
            onClick={useGeneratedAddresses}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
          >
            Use Deployed Contracts
          </button>
        </div>
      )}

      <p className="mb-4 text-gray-600">
        {hasAddressFile
          ? "You can use the detected addresses above or manually enter different ones below:"
          : "Enter the addresses of your deployed contracts:"}
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
    </div>
  );
}

export default SetupContracts;
