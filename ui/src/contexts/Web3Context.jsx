import React, { createContext, useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import VotingTokenABI from "../abis/VotingToken.json";
import TokenVotingABI from "../abis/TokenVoting.json";

// Try to load contract addresses from different sources
let contractAddresses = {
  votingToken: "",
  tokenVoting: "",
};

// Try localStorage first
if (
  localStorage.getItem("VOTING_TOKEN_ADDRESS") &&
  localStorage.getItem("TOKEN_VOTING_ADDRESS")
) {
  contractAddresses = {
    votingToken: localStorage.getItem("VOTING_TOKEN_ADDRESS"),
    tokenVoting: localStorage.getItem("TOKEN_VOTING_ADDRESS"),
  };
  console.log("Using contract addresses from localStorage:", contractAddresses);
}

// Then try to load from the JSON file
try {
  // This is a dynamic import that might not work in all environments
  // We'll provide a fallback mechanism
  const addressesFromFile = require("../contractAddresses.json");
  if (
    addressesFromFile &&
    addressesFromFile.votingToken &&
    addressesFromFile.tokenVoting
  ) {
    contractAddresses = addressesFromFile;
    console.log("Using contract addresses from JSON file:", contractAddresses);

    // Also update localStorage
    localStorage.setItem("VOTING_TOKEN_ADDRESS", addressesFromFile.votingToken);
    localStorage.setItem("TOKEN_VOTING_ADDRESS", addressesFromFile.tokenVoting);
  }
} catch (e) {
  console.log("Could not load contract addresses from file:", e);
}

const Web3Context = createContext();

// Hardhat default URL
const RPC_URL = "http://localhost:8545";

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [currentAddresses, setCurrentAddresses] = useState(contractAddresses);

  // Initialize provider on component mount
  useEffect(() => {
    const initProvider = async () => {
      try {
        console.log("Initializing provider...");
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        try {
          // Test connection by getting network
          const network = await provider.getNetwork();
          console.log("Connected to network:", network);

          // Get accounts
          const accounts = await provider.listAccounts();
          console.log(
            "Available accounts:",
            accounts.map((acc) => acc.address),
          );

          setProvider(provider);
          setAvailableAccounts(accounts);
        } catch (err) {
          console.error("Error connecting to network:", err);
          setError(
            "Failed to connect to local blockchain. Is Hardhat running at " +
              RPC_URL +
              "?",
          );
        }
      } catch (err) {
        console.error("Error initializing provider:", err);
        setError("Failed to initialize provider: " + err.message);
      }
    };

    initProvider();
  }, []);

  // Connect wallet (select an account from Hardhat)
  const connectWallet = async (accountIndex = 0) => {
    console.log("Connecting wallet with account index:", accountIndex);
    if (!provider) {
      setError("Provider not initialized. Please try again.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get account from Hardhat node
      const accounts = await provider.listAccounts();
      console.log(
        "Available accounts:",
        accounts.map((acc) => acc.address),
      );

      if (accounts.length === 0) {
        throw new Error("No accounts available on the local node");
      }

      // Use the selected account or default to the first one
      const account = accounts[accountIndex];
      console.log("Selected account:", account.address);

      const signer = await provider.getSigner(account.address);
      console.log("Got signer for account");

      // Initialize contracts if addresses are available
      let votingToken = null;
      let tokenVoting = null;

      if (currentAddresses.votingToken && currentAddresses.tokenVoting) {
        console.log("Initializing contracts with addresses:", currentAddresses);

        votingToken = new ethers.Contract(
          currentAddresses.votingToken,
          VotingTokenABI.abi,
          signer,
        );

        tokenVoting = new ethers.Contract(
          currentAddresses.tokenVoting,
          TokenVotingABI.abi,
          signer,
        );

        console.log("Contracts initialized");
      } else {
        console.warn(
          "Contract addresses not set. Set them up first at /setup.",
        );
        setError("Contract addresses not set. Please go to Setup page first.");
      }

      setAccount(account.address);
      setSigner(signer);
      setContracts({ votingToken, tokenVoting });
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to a different account
  const switchAccount = async (accountIndex) => {
    if (!provider) return;

    try {
      await connectWallet(accountIndex);
    } catch (err) {
      console.error("Error switching account:", err);
      setError(err.message);
    }
  };

  // Update contract addresses
  const setContractAddresses = (tokenAddress, votingAddress) => {
    console.log("Setting contract addresses:", tokenAddress, votingAddress);
    localStorage.setItem("VOTING_TOKEN_ADDRESS", tokenAddress);
    localStorage.setItem("TOKEN_VOTING_ADDRESS", votingAddress);

    const newAddresses = {
      votingToken: tokenAddress,
      tokenVoting: votingAddress,
    };

    setCurrentAddresses(newAddresses);

    // If we already have a signer, initialize the contracts with the new addresses
    if (signer) {
      const votingToken = new ethers.Contract(
        tokenAddress,
        VotingTokenABI.abi,
        signer,
      );

      const tokenVoting = new ethers.Contract(
        votingAddress,
        TokenVotingABI.abi,
        signer,
      );

      setContracts({ votingToken, tokenVoting });
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        contracts,
        availableAccounts,
        connectWallet,
        switchAccount,
        isConnecting,
        error,
        setContractAddresses,
        currentAddresses,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  return useContext(Web3Context);
}
