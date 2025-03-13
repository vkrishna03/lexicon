// This simulates a blockchain service for the voting system
// In a real implementation, this would interact with smart contracts

// Store elections in localStorage to persist data
const ELECTIONS_KEY = 'blockchain_voting_elections';
const CANDIDATES_KEY = 'blockchain_voting_candidates';
const VOTES_KEY = 'blockchain_voting_votes';

// Initialize storage if it doesn't exist
const initializeStorage = () => {
  if (!localStorage.getItem(ELECTIONS_KEY)) {
    localStorage.setItem(ELECTIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CANDIDATES_KEY)) {
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify({}));
  }
  if (!localStorage.getItem(VOTES_KEY)) {
    localStorage.setItem(VOTES_KEY, JSON.stringify({}));
  }
};

// Get all elections
export const getElections = async () => {
  initializeStorage();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const elections = JSON.parse(localStorage.getItem(ELECTIONS_KEY));
  
  // Calculate current status for each election
  const now = new Date();
  
  return elections.map(election => {
    const startDate = new Date(election.startDate);
    const nominationEndDate = new Date(election.nominationEndDate);
    const endDate = new Date(election.endDate);
    
    let status = 'Upcoming';
    if (now >= startDate && now < nominationEndDate) {
      status = 'Nomination';
    } else if (now >= nominationEndDate && now < endDate) {
      status = 'Voting';
    } else if (now >= endDate) {
      status = 'Completed';
    }
    
    return { ...election, status };
  });
};

// Get a specific election by ID
export const getElection = async (electionId) => {
  const elections = await getElections();
  return elections.find(election => election.id === electionId);
};

// Create a new election
export const createElection = async (electionData) => {
  initializeStorage();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const elections = JSON.parse(localStorage.getItem(ELECTIONS_KEY));
  
  // Generate a unique ID
  const id = Date.now().toString();
  
  // Add the new election
  const newElection = {
    id,
    ...electionData,
    timestamp: new Date().toISOString()
  };
  
  elections.push(newElection);
  localStorage.setItem(ELECTIONS_KEY, JSON.stringify(elections));
  
  // Initialize candidates array for this election
  const candidates = JSON.parse(localStorage.getItem(CANDIDATES_KEY));
  candidates[id] = [];
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
  
  // Initialize votes tracking for this election
  const votes = JSON.parse(localStorage.getItem(VOTES_KEY));
  votes[id] = {};
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  
  return newElection;
};

// Get candidates for an election
export const getCandidates = async (electionId) => {
  initializeStorage();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const candidates = JSON.parse(localStorage.getItem(CANDIDATES_KEY));
  return candidates[electionId] || [];
};

// Nominate a candidate
export const nominateCandidate = async (electionId, candidateData) => {
  initializeStorage();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const candidates = JSON.parse(localStorage.getItem(CANDIDATES_KEY));
  
  // Check if the candidate already exists (by wallet address)
  const existingCandidates = candidates[electionId] || [];
  const candidateExists = existingCandidates.some(
    c => c.address.toLowerCase() === candidateData.address.toLowerCase()
  );
  
  if (candidateExists) {
    throw new Error('You are already nominated for this election');
  }
  
  // Add the new candidate
  if (!candidates[electionId]) {
    candidates[electionId] = [];
  }
  
  candidates[electionId].push({
    ...candidateData,
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
  
  return candidateData;
};

// Cast a vote
export const castVote = async (electionId, voterAddress, candidateAddress) => {
  initializeStorage();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Check if voter has already voted
  const votes = JSON.parse(localStorage.getItem(VOTES_KEY));
  if (!votes[electionId]) {
    votes[electionId] = {};
  }
  
  if (votes[electionId][voterAddress]) {
    throw new Error('You have already voted in this election');
  }
  
  // Record the vote
  votes[electionId][voterAddress] = candidateAddress;
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  
  // Update candidate vote count
  const candidates = JSON.parse(localStorage.getItem(CANDIDATES_KEY));
  const candidateIndex = candidates[electionId].findIndex(
    c => c.address.toLowerCase() === candidateAddress.toLowerCase()
  );
  
  if (candidateIndex !== -1) {
    if (!candidates[electionId][candidateIndex].voteCount) {
      candidates[electionId][candidateIndex].voteCount = 0;
    }
    candidates[electionId][candidateIndex].voteCount += 1;
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
  }
  
  return true;
};

// Check if a voter has already voted
export const hasVoted = async (electionId, voterAddress) => {
  initializeStorage();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const votes = JSON.parse(localStorage.getItem(VOTES_KEY));
  return votes[electionId] && votes[electionId][voterAddress] !== undefined;
};

// Get election results
export const getElectionResults = async (electionId) => {
  const candidates = await getCandidates(electionId);
  return candidates.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
};