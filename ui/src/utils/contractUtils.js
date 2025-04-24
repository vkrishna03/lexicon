import { ethers } from "ethers";
import VotingSystemABI from "../abis/VotingSystem.json";
import VotingTokenABI from "../abis/VotingToken.json";
import deployedAddresses from "../contractAddresses.json";

class ContractManager {
  constructor() {
    this.provider = new ethers.JsonRpcProvider("http://localhost:8545");
    this.currentWallet = null;
    this.votingSystem = null;
    this.votingToken = null;
    this.initialize();
  }

  async initialize() {
    try {
      await this.loadContracts();
      await this.autoConnectWallet();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  async loadContracts() {
    try {
      // Load addresses from deployment file
      this.votingSystem = new ethers.Contract(
        deployedAddresses.votingSystem,
        VotingSystemABI.abi,
        this.provider,
      );

      this.votingToken = new ethers.Contract(
        deployedAddresses.votingToken,
        VotingTokenABI.abi,
        this.provider,
      );

      console.log("Contracts loaded automatically from deployment");
    } catch (error) {
      console.error("Error loading contracts from deployment:", error);
      throw error;
    }
  }

  async autoConnectWallet() {
    try {
      const accounts = await this.provider.listAccounts();

      if (accounts.length === 0) {
        throw new Error("No accounts available. Is Hardhat running?");
      }

      // Use the first account by default
      const account = accounts[0];
      this.currentWallet = await this.provider.getSigner(account.address);

      // Connect contracts to the signer
      if (this.votingSystem && this.votingToken) {
        this.votingSystem = this.votingSystem.connect(this.currentWallet);
        this.votingToken = this.votingToken.connect(this.currentWallet);
      }

      return {
        address: account.address,
        index: 0,
      };
    } catch (error) {
      console.error("Error in auto wallet connection:", error);
      throw error;
    }
  }

  async switchAccount(accountIndex) {
    try {
      const accounts = await this.provider.listAccounts();

      if (accountIndex >= accounts.length) {
        throw new Error("Account index out of range");
      }

      const account = accounts[accountIndex];
      this.currentWallet = await this.provider.getSigner(account.address);

      // Reconnect contracts with the new signer
      if (this.votingSystem && this.votingToken) {
        this.votingSystem = this.votingSystem.connect(this.currentWallet);
        this.votingToken = this.votingToken.connect(this.currentWallet);
      }

      return {
        address: account.address,
        index: accountIndex,
      };
    } catch (error) {
      console.error("Error switching account:", error);
      throw error;
    }
  }

  // Election Management Functions
  async createElection(
    name,
    description,
    nominationStart,
    nominationEnd,
    votingStart,
    votingEnd,
  ) {
    try {
      // Convert date strings to Unix timestamps (seconds)

      const nominationStartTime = Math.floor(
        new Date(nominationStart).getTime() / 1000,
      );
      const nominationEndTime = Math.floor(
        new Date(nominationEnd).getTime() / 1000,
      );
      const votingStartTime = Math.floor(
        new Date(votingStart).getTime() / 1000,
      );
      const votingEndTime = Math.floor(new Date(votingEnd).getTime() / 1000);

      console.log("Creating election with dates (seconds since epoch):", {
        nominationStartTime,
        nominationEndTime,
        votingStartTime,
        votingEndTime,
      });

      const tx = await this.votingSystem.createElection(
        name,
        description,
        nominationStartTime,
        nominationEndTime,
        votingStartTime,
        votingEndTime,
      );

      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      return {
        transactionHash: tx.hash,
        success: true,
      };
    } catch (error) {
      console.error("Error creating election:", error);
      throw error;
    }
  }

  async nominateCandidate(electionId, name, manifestoURI) {
    try {
      const tx = await this.votingSystem.nominateCandidate(
        electionId,
        name,
        manifestoURI,
      );
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error nominating candidate:", error);
      throw error;
    }
  }

  async castVote(electionId, candidateId) {
    try {
      console.log("Casting vote for candidate", candidateId, "in election", electionId);
      
      // First check if contracts are initialized
      if (!this.votingToken || !this.votingSystem || !this.currentWallet) {
        throw new Error("Contracts or wallet not initialized");
      }

      // Get voting power
      const votingPower = await this.votingSystem.getVotingPower(
        this.currentWallet.address
      );
      console.log("Voting power:", votingPower.toString());

      // Approve token spending
      const approveTx = await this.votingToken.approve(
        this.votingSystem.target,
        votingPower
      );
      console.log("Approval transaction sent:", approveTx.hash);
      await approveTx.wait();
      console.log("Token approval confirmed");
      // Cast vote
      const voteTx = await this.votingSystem.castVote(
        electionId, 
        candidateId
      );
      console.log("Vote transaction sent:", voteTx.hash);
      const receipt = await voteTx.wait();
      console.log("Vote transaction confirmed:", receipt);

      return receipt;
    } catch (error) {
      console.error("Error in castVote:", error);
      // Add more context to the error
      if (!this.votingToken) {
        throw new Error("VotingToken contract not initialized");
      }
      if (!this.votingSystem) {
        throw new Error("VotingSystem contract not initialized");
      }
      if (!this.currentWallet) {
        throw new Error("Wallet not connected");
      }
      throw error;
    }
  }


  // View Functions
  async getElectionDetails(electionId) {
    try {
      const details = await this.votingSystem.getElectionDetails(electionId);

      console.log("Raw timestamp values:", {
        nominationStart: details[2],
        nominationEnd: details[3],
        votingStart: details[4],
        votingEnd: details[5],
      });

      const convertTimestamp = (timestamp) => {
        const num = Number(timestamp);
        // If the timestamp is very large (represents a date past year 3000),
        // it's likely already in milliseconds
        if (num > 32503680000) {
          // Jan 1, 3000 in seconds since epoch
          return new Date(num);
        }
        // Otherwise, assume it's in seconds and convert to milliseconds
        return new Date(num * 1000);
      };

      return {
        name: details[0],
        description: details[1],
        nominationStart: new Date(Number(details[2]) * 1000),
        nominationEnd: convertTimestamp(details[3]),
        votingStart: convertTimestamp(details[4]),
        votingEnd: convertTimestamp(details[5]),
        state: details[6].toString(),
        totalVotes: details[7].toString(),
      };
    } catch (error) {
      console.error("Error getting election details:", error);
      throw error;
    }
  }

  async getAllCandidates(electionId) {
    try {
      const candidates = await this.votingSystem.getAllCandidates(electionId);
      return candidates[0].map((_, index) => ({
        id: candidates[0][index].toString(),
        address: candidates[1][index],
        name: candidates[2][index],
        manifestoURI: candidates[3][index],
        voteCount: candidates[4][index].toString(),
      }));
    } catch (error) {
      console.error("Error getting candidates:", error);
      throw error;
    }
  }

  async getActiveElections() {
    try {
      const activeElections = await this.votingSystem.getActiveElections();
      return activeElections.map((id) => id.toString());
    } catch (error) {
      console.error("Error getting active elections:", error);
      throw error;
    }
  }

  async getElectionTimeStatus(electionId) {
    try {
      const status = await this.votingSystem.getElectionTimeStatus(electionId);
      return {
        state: Number(status[0]),
        timeUntilNext: status[1].toString(),
        phase: status[2],
      };
    } catch (error) {
      console.error("Error getting election status:", error);
      throw error;
    }
  }

  // User-related functions
  async getVotingPower(address) {
    try {
      const power = await this.votingSystem.getVotingPower(address);
      return ethers.formatEther(power);
    } catch (error) {
      console.error("Error getting voting power:", error);
      throw error;
    }
  }

  async hasUserVoted(electionId, address) {
    try {
      const hasVoted = await this.votingSystem.hasUserVoted(electionId, address);
    } catch (error) {
      console.error("Error checking if user voted:", error);
      throw error;
    }
  }

  async canUserNominate(electionId, address) {
    try {
      const [canNominate, reason] = await this.votingSystem.canNominate(
        electionId,
        address,
      );
      return { canNominate, reason };
    } catch (error) {
      console.error("Error checking nomination eligibility:", error);
      throw error;
    }
  }

  async canUserVote(electionId, address) {
    try {
      const [canVote, reason] = await this.votingSystem.canVote(
        electionId,
        address,
      );
      return { canVote, reason };
    } catch (error) {
      console.error("Error checking voting eligibility:", error);
      throw error;
    }
  }

  // Token Management
  async getTokenBalance(address) {
    try {
      const balance = await this.votingToken.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }

  async approveTokens(spender, amount) {
    try {
      const tx = await this.votingToken.approve(
        spender,
        ethers.parseEther(amount),
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error approving tokens:", error);
      throw error;
    }
  }
}

export const contractManager = new ContractManager();
