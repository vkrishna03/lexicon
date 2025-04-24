import { createContext, useContext, useState, useEffect } from "react";
import { contractManager } from "../utils/contractUtils";

const VotingContext = createContext();

export function VotingProvider({ children }) {
  // State management
  const [state, setState] = useState({
    loading: true,
    error: null,
    wallet: null,
    activeElections: [],
    upcomingElections: [],
    pastElections: [],
    userVotingPower: "0",
    userTokenBalance: "0",
    userNominations: [],
    userVotes: [],
  });

  // Helper function to update state
  const updateState = (newState) => {
    setState((prevState) => ({ ...prevState, ...newState }));
  };

  // Initialize system
  useEffect(() => {
    initializeSystem();
  }, []);

  // Load data when wallet changes
  useEffect(() => {
    if (state.wallet) {
      loadUserData();
      loadElectionData();
    }
  }, [state.wallet]);

  // Core initialization function
  const initializeSystem = async () => {
    try {
      updateState({ loading: true, error: null });
      const walletInfo = await contractManager.connectWallet();
      updateState({ wallet: walletInfo });
    } catch (error) {
      updateState({ error: "Failed to initialize system" });
      console.error("Initialization error:", error);
    } finally {
      updateState({ loading: false });
    }
  };

  // Data loading handlers
  const loadUserData = async () => {
    try {
      const [balance, votingPower] = await Promise.all([
        contractManager.getTokenBalance(state.wallet.address),
        contractManager.getVotingPower(state.wallet.address),
      ]);

      updateState({
        userTokenBalance: balance,
        userVotingPower: votingPower,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadElectionData = async () => {
    try {
      updateState({ loading: true });
      const activeIds = await contractManager.getActiveElections();

      const activeElections = await Promise.all(
        activeIds.map(async (id) => {
          const [details, candidates, timeStatus] = await Promise.all([
            contractManager.getElectionDetails(id),
            contractManager.getAllCandidates(id),
            contractManager.getElectionTimeStatus(id),
          ]);

          return {
            id,
            ...details,
            candidates,
            timeStatus,
          };
        }),
      );

      updateState({ activeElections });
    } catch (error) {
      updateState({ error: "Failed to load election data" });
      console.error("Election data error:", error);
    } finally {
      updateState({ loading: false });
    }
  };

  // Election Management Handlers
  const electionHandlers = {
    createElection: async (electionData) => {
      try {
        updateState({ loading: true, error: null });

        const result = await contractManager.createElection(
          electionData.name,
          electionData.description,
          electionData.nominationStart,
          electionData.nominationEnd,
          electionData.votingStart,
          electionData.votingEnd,
        );

        await loadElectionData();
        return result;
      } catch (error) {
        updateState({ error: "Failed to create election" });
        throw error;
      } finally {
        updateState({ loading: false });
      }
    },

    nominateCandidate: async (electionId, candidateName, manifestoURI) => {
      try {
        updateState({ loading: true, error: null });

        const eligibility = await contractManager.canUserNominate(
          electionId,
          state.wallet.address,
        );

        if (!eligibility.canNominate) {
          throw new Error(eligibility.reason);
        }

        await contractManager.nominateCandidate(
          electionId,
          candidateName,
          manifestoURI,
        );

        await loadElectionData();
      } catch (error) {
        updateState({ error: "Nomination failed" });
        throw error;
      } finally {
        updateState({ loading: false });
      }
    },

    castVote: async (electionId, candidateId) => {
      try {
        updateState({ loading: true, error: null });

        const eligibility = await contractManager.canUserVote(
          electionId,
          state.wallet.address,
        );

        if (!eligibility.canVote) {
          throw new Error(eligibility.reason);
        }

        await contractManager.castVote(electionId, candidateId);

        await Promise.all([loadElectionData(), loadUserData()]);
      } catch (error) {
        updateState({ error: "Voting failed" });
        throw error;
      } finally {
        updateState({ loading: false });
      }
    },
  };

  // Query Handlers
  const queryHandlers = {
    getElection: async (electionId) => {
      try {
        const [details, candidates, timeStatus] = await Promise.all([
          contractManager.getElectionDetails(electionId),
          contractManager.getAllCandidates(electionId),
          contractManager.getElectionTimeStatus(electionId),
        ]);

        return { id: electionId, ...details, candidates, timeStatus };
      } catch (error) {
        console.error("Error fetching election:", error);
        throw error;
      }
    },

    checkUserStatus: async (electionId) => {
      try {
        const [hasVoted, canVote, canNominate] = await Promise.all([
          contractManager.hasUserVoted(electionId, state.wallet.address),
          contractManager.canUserVote(electionId, state.wallet.address),
          contractManager.canUserNominate(electionId, state.wallet.address),
        ]);

        return { hasVoted, canVote, canNominate };
      } catch (error) {
        console.error("Error checking user status:", error);
        throw error;
      }
    },
  };

  // Utility Handlers
  const utilityHandlers = {
    refreshData: async () => {
      await Promise.all([loadUserData(), loadElectionData()]);
    },

    formatElectionTimes: (election) => {
      return {
        ...election,
        nominationStart: new Date(election.nominationStart * 1000),
        nominationEnd: new Date(election.nominationEnd * 1000),
        votingStart: new Date(election.votingStart * 1000),
        votingEnd: new Date(election.votingEnd * 1000),
      };
    },
  };

  // Context value
  const value = {
    // State
    ...state,

    // Election handlers
    ...electionHandlers,

    // Query handlers
    ...queryHandlers,

    // Utility handlers
    ...utilityHandlers,
  };

  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  );
}

// Custom hook to use the voting context
export function useVoting() {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error("useVoting must be used within a VotingProvider");
  }
  return context;
}

// Action types for specific operations
export const VotingActions = {
  CREATE_ELECTION: "CREATE_ELECTION",
  NOMINATE_CANDIDATE: "NOMINATE_CANDIDATE",
  CAST_VOTE: "CAST_VOTE",
  UPDATE_USER_DATA: "UPDATE_USER_DATA",
  UPDATE_ELECTION_DATA: "UPDATE_ELECTION_DATA",
  SET_ERROR: "SET_ERROR",
  SET_LOADING: "SET_LOADING",
};
