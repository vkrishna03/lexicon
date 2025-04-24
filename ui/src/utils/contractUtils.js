import { ethers } from "ethers";
import VotingSystemABI from "../../../blockchain/artifacts/contracts/VotingSystem.sol/VotingSystem.json";
import VotingTokenABI from "../../../blockchain/artifacts/contracts/VotingToken.sol/VotingToken.json";
import deployedAddresses from "../../../blockchain/deployment/addresses.json";

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
        this.provider
      );

      this.votingToken = new ethers.Contract(
        deployedAddresses.votingToken,
        VotingTokenABI.abi,
        this.provider
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
        index: 0
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
        index: accountIndex
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
      const tx = await this.votingSystem.createElection(
        name,
        description,
        nominationStart,
        nominationEnd,
        votingStart,
        votingEnd,
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "ElectionCreated");
      return {
        electionId: event.args.electionId.toString(),
        timestamp: event.args.timestamp.toString(),
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
        this.currentWallet.address,
      );
      await this.votingToken.approve(this.votingSystem.address, votingPower);

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
      const details = await this.votingSystem.getElectionDetails(electionId);
      return {
        name: details[0],
        description: details[1],
        nominationStart: new Date(details[2].toNumber() * 1000),
        nominationEnd: new Date(details[3].toNumber() * 1000),
        votingStart: new Date(details[4].toNumber() * 1000),
        votingEnd: new Date(details[5].toNumber() * 1000),
        state: details[6],
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
        state: status[0],
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
        ethers.utils.parseEther(amount),
      );
      return await tx.wait();
    } catch (error) {
      console.error("Error approving tokens:", error);
      throw error;
    }
  }
}

export const contractManager = new ContractManager();
