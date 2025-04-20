import { ethers } from "ethers";

// Helper to convert timestamp to seconds
const toBlockchainTimestamp = (dateString) => {
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// Helper to convert seconds to JS Date
const fromBlockchainTimestamp = (timestamp) => {
  return new Date(Number(timestamp) * 1000);
};

// Get all elections
export const getElections = async (tokenVotingContract) => {
  try {
    // Get election count
    const electionCount = await tokenVotingContract.electionCount();
    const count = Number(electionCount);

    // Fetch each election
    const elections = [];
    for (let i = 1; i <= count; i++) {
      try {
        const election = await getElection(tokenVotingContract, i.toString());
        if (election) {
          elections.push(election);
        }
      } catch (error) {
        console.error(`Error fetching election ${i}:`, error);
      }
    }

    return elections;
  } catch (error) {
    console.error("Error fetching elections:", error);
    throw new Error("Failed to fetch elections");
  }
};

// Get a specific election by ID
export const getElection = async (tokenVotingContract, electionId) => {
  try {
    // Fetch election data from contract
    const electionData = await tokenVotingContract.elections(electionId);

    if (!electionData || !electionData.name) {
      return null;
    }

    // Structure the election data
    const now = new Date();
    const startDate = fromBlockchainTimestamp(electionData.startTime);
    const endDate = fromBlockchainTimestamp(electionData.endTime);

    // Calculate nomination end date (halfway between start and end)
    const nominationEndDate = new Date(
      (startDate.getTime() + endDate.getTime()) / 2,
    );

    let status = "Upcoming";
    if (now >= startDate && now < nominationEndDate) {
      status = "Nomination";
    } else if (now >= nominationEndDate && now < endDate) {
      status = "Voting";
    } else if (now >= endDate) {
      status = "Completed";
    }

    return {
      id: electionId.toString(),
      title: electionData.name,
      description: "Election created on blockchain", // Your contract doesn't store description
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nominationEndDate: nominationEndDate.toISOString(),
      isActive: electionData.isActive,
      totalVotes: electionData.totalVotes?.toString() || "0",
      status,
    };
  } catch (error) {
    console.error(`Error fetching election ${electionId}:`, error);
    throw new Error(`Failed to fetch election ${electionId}`);
  }
};

// Create a new election
export const createElection = async (tokenVotingContract, electionData) => {
  try {
    const startTimestamp = toBlockchainTimestamp(electionData.startDate);
    const endTimestamp = toBlockchainTimestamp(electionData.endDate);

    // Call contract method to create election
    const tx = await tokenVotingContract.createElection(
      electionData.title,
      startTimestamp,
      endTimestamp,
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Election created:", receipt);

    // Get the new election ID (should be electionCount)
    const electionCount = await tokenVotingContract.electionCount();
    const electionId = electionCount.toString();

    // Return the newly created election
    return await getElection(tokenVotingContract, electionId);
  } catch (error) {
    console.error("Error creating election:", error);
    throw new Error("Failed to create election: " + error.message);
  }
};

// Get candidates for an election - we need to adapt this since your contract
// doesn't have direct candidate listing
export const getCandidates = async (tokenVotingContract, electionId) => {
  try {
    // In your contract, candidates are tracked by candidateId (number)
    // We need to check which candidate IDs exist (up to some limit)
    const candidateLimit = 10; // Check the first 10 possible candidate IDs
    const candidates = [];

    for (let i = 1; i <= candidateLimit; i++) {
      try {
        const isCandidate = await tokenVotingContract
          .elections(electionId)
          .candidates(i);
        if (isCandidate) {
          const voteCount = await tokenVotingContract
            .elections(electionId)
            .votes(i);

          candidates.push({
            address: `0x${i.toString(16).padStart(40, "0")}`, // Generate a fake address based on ID
            name: `Candidate ${i}`,
            platform: "Candidate platform information",
            voteCount: voteCount.toString(),
            id: i,
          });
        }
      } catch (error) {
        // Candidate doesn't exist at this ID, continue to next
        console.error(`Error checking candidate ${i}:`, error);
      }
    }

    return candidates;
  } catch (error) {
    console.error(
      `Error fetching candidates for election ${electionId}:`,
      error,
    );
    throw new Error("Failed to fetch candidates");
  }
};

// Nominate a candidate
export const nominateCandidate = async (
  tokenVotingContract,
  electionId,
  candidateId,
) => {
  try {
    // In your contract, nominate takes an electionId and candidateId
    const tx = await tokenVotingContract.nominate(electionId, candidateId);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error nominating candidate:", error);
    throw new Error("Failed to nominate: " + error.message);
  }
};

// Cast a vote
export const castVote = async (
  tokenVotingContract,
  electionId,
  candidateId,
) => {
  try {
    // Register before voting
    await tokenVotingContract.registerVoter(electionId);

    // Then vote
    const tx = await tokenVotingContract.vote(electionId, candidateId);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Error casting vote:", error);
    throw new Error("Failed to cast vote: " + error.message);
  }
};

// Check if a voter has already voted
export const hasVoted = async (
  tokenVotingContract,
  electionId,
  voterAddress,
) => {
  try {
    // This is a simplification - your contract doesn't expose this directly
    // We would need to get the voter info from the contract
    const voterInfo = await tokenVotingContract
      .elections(electionId)
      .voters(voterAddress);
    return voterInfo.hasVoted;
  } catch (error) {
    console.error("Error checking if voter has voted:", error);
    return false; // Assume not voted if we can't check
  }
};

// Get election results
export const getElectionResults = async (tokenVotingContract, electionId) => {
  try {
    // Get the raw results array
    const resultsArray = await tokenVotingContract.getResults(electionId);

    // Get candidates with their data
    const candidates = await getCandidates(tokenVotingContract, electionId);

    // Match results with candidates
    for (let i = 0; i < Math.min(resultsArray.length, candidates.length); i++) {
      candidates[i].voteCount = resultsArray[i].toString();
    }

    return candidates.sort((a, b) => Number(b.voteCount) - Number(a.voteCount));
  } catch (error) {
    console.error("Error getting election results:", error);
    throw new Error("Failed to get election results");
  }
};
