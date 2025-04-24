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

      // Add validation to ensure timestamps are in order
      if (
        nominationStartTime >= nominationEndTime ||
        nominationEndTime >= votingStartTime ||
        votingStartTime >= votingEndTime
      ) {
        throw new Error("Election phases must be in chronological order");
      }

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

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);

      // Important: call updateElectionState to ensure the state is set correctly
      const electionId = await this.votingSystem.electionCount();

      if (electionId) {
        // Update the election state immediately
        await this.updateElectionState(electionId);
        console.log(`Created and updated election ${electionId}`);
      }

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
      // First approve token spending
      const votingPower = await this.votingSystem.getVotingPower(
        await this.currentWallet.getAddress(),
      );

      console.log("Approving tokens for voting:", votingPower.toString());

      const approveTx = await this.votingToken.approve(
        this.votingSystem.address,
        votingPower,
      );
      await approveTx.wait();
      console.log("Token approval confirmed");

      const tx = await this.votingSystem.castVote(electionId, candidateId);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error casting vote:", error);
      throw error;
    }
  }

  // View Functions
  async getElectionDetails(electionId) {
    try {
      await this.updateElectionState(electionId);
      const details = await this.votingSystem.getElectionDetails(electionId);

      // Always convert to milliseconds for JavaScript Date objects
      return {
        name: details[0],
        description: details[1],
        nominationStart: new Date(Number(details[2]) * 1000),
        nominationEnd: new Date(Number(details[3]) * 1000),
        votingStart: new Date(Number(details[4]) * 1000),
        votingEnd: new Date(Number(details[5]) * 1000),
        state: Number(details[6]), // Use Number to get proper enum value
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

      // Make sure we log the phase to debug
      console.log("Election phase from contract:", status[2]);

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
      return await this.votingSystem.hasUserVoted(electionId, address);
    } catch (error) {
      console.error("Error checking if user voted:", error);
      throw error;
    }
  }

  async canUserNominate(electionId, address) {
    try {
      await this.updateElectionState(electionId);

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
    // First update the election state
    await this.updateElectionState(electionId);

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

  async updateElectionState(electionId) {
    try {
      // Call the contract's updateElectionState function
      const tx = await this.votingSystem.updateElectionState(electionId);
      await tx.wait();
      console.log(`Updated election ${electionId} state`);
    } catch (error) {
      console.error("Error updating election state:", error);
    }
  }
}

export const contractManager = new ContractManager();
