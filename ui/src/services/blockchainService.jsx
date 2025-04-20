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
    console.log("Getting election count...");
    // Get election count
    const electionCountBN = await tokenVotingContract.electionCount();
    const electionCount = parseInt(electionCountBN.toString());
    console.log("Election count:", electionCount);

    // Fetch each election
    const elections = [];
    for (let i = 1; i <= electionCount; i++) {
      try {
        console.log(`Fetching election ${i}...`);
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
    throw new Error("Failed to fetch elections: " + error.message);
  }
};

// Get a specific election by ID
export const getElection = async (tokenVotingContract, electionId) => {
  try {
    console.log(`Getting election ${electionId}...`);
    // Fetch election data from contract
    const electionData = await tokenVotingContract.elections(electionId);
    console.log("Raw election data:", electionData);

    // Check if the election exists (has a name)
    if (!electionData || !electionData.name) {
      console.log(`Election ${electionId} does not exist or has no name`);
      return null;
    }

    // Structure the election data
    const now = new Date();
    const startDate = fromBlockchainTimestamp(electionData.startTime);
    const endDate = fromBlockchainTimestamp(electionData.endTime);

    // Calculate nomination end date (halfway between start and end for simplicity)
    const nominationEndDate = new Date(
      (startDate.getTime() + endDate.getTime()) / 2,
    );

    let status = "Upcoming";
    if (now >= startDate && now < endDate) {
      status = "Active";
    } else if (now >= endDate) {
      status = "Completed";
    }

    return {
      id: electionId.toString(),
      title: electionData.name,
      description: `Election #${electionId}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      nominationEndDate: nominationEndDate.toISOString(),
      isActive: electionData.isActive,
      totalVotes: electionData.totalVotes
        ? electionData.totalVotes.toString()
        : "0",
      status,
    };
  } catch (error) {
    console.error(`Error fetching election ${electionId}:`, error);
    throw new Error(`Failed to fetch election ${electionId}: ${error.message}`);
  }
};

// Create a new election
export const createElection = async (tokenVotingContract, electionData) => {
  try {
    console.log("Creating election with data:", electionData);
    const startTimestamp = toBlockchainTimestamp(electionData.startDate);
    const endTimestamp = toBlockchainTimestamp(electionData.endDate);

    console.log("Start timestamp:", startTimestamp);
    console.log("End timestamp:", endTimestamp);

    // Call contract method to create election
    console.log("Sending transaction to create election...");
    const tx = await tokenVotingContract.createElection(
      electionData.title,
      startTimestamp,
      endTimestamp,
    );

    console.log("Transaction sent, waiting for confirmation...");
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    // Get the new election count to determine the id
    const electionCountBN = await tokenVotingContract.electionCount();
    const newElectionId = electionCountBN.toString();
    console.log("New election ID:", newElectionId);

    // Return the newly created election
    return await getElection(tokenVotingContract, newElectionId);
  } catch (error) {
    console.error("Error creating election:", error);
    throw new Error("Failed to create election: " + error.message);
  }
};

// Get candidates for an election

// Nominate a candidate
export const nominateCandidate = async (
  tokenVotingContract,
  electionId,
  candidateId,
) => {
  try {
    console.log(
      `Nominating candidate ${candidateId} for election ${electionId}...`,
    );
    // Call contract method to nominate
    const tx = await tokenVotingContract.nominate(electionId, candidateId);
    console.log("Transaction sent, waiting for confirmation...");
    await tx.wait();
    console.log("Nomination confirmed");
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
    console.log(
      `Casting vote for candidate ${candidateId} in election ${electionId}...`,
    );

    // First register as a voter if not already registered
    console.log("Registering as voter...");
    try {
      const registerTx = await tokenVotingContract.registerVoter(electionId);
      await registerTx.wait();
      console.log("Voter registration confirmed");
    } catch (regError) {
      // If already registered, this will fail, which is fine
      console.log(
        "Registration error (may be already registered):",
        regError.message,
      );
    }

    // Then vote
    console.log("Sending vote transaction...");
    const voteTx = await tokenVotingContract.vote(electionId, candidateId);
    console.log("Vote transaction sent, waiting for confirmation...");
    await voteTx.wait();
    console.log("Vote confirmed");

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
    console.log(
      `Checking if ${voterAddress} has voted in election ${electionId}...`,
    );
    // Get voter info from the contract
    const voter = await tokenVotingContract
      .elections(electionId)
      .voters(voterAddress);
    return voter && voter.hasVoted;
  } catch (error) {
    console.error("Error checking voting status:", error);
    return false; // Assume not voted if there's an error
  }
};

// Get election results
export const getElectionResults = async (tokenVotingContract, electionId) => {
  try {
    console.log(`Getting results for election ${electionId}...`);
    const results = await tokenVotingContract.getResults(electionId);
    console.log("Raw results:", results);

    // Get the candidate details to match with results
    const candidates = await getCandidates(tokenVotingContract, electionId);

    // Sort candidates by vote count
    return candidates.sort(
      (a, b) => parseInt(b.voteCount) - parseInt(a.voteCount),
    );
  } catch (error) {
    console.error("Error getting election results:", error);
    throw new Error("Failed to get election results: " + error.message);
  }
};
