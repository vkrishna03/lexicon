import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { contractManager } from "../utils/contractUtils";
import { VotingContext } from "./votingContextDefs";

export function VotingProvider({ children }) {
  const navigate = useNavigate();
  
  const [state, setState] = useState({
    loading: false,
    error: null,
    account: null,
    wallet: null,
    isConnected: false,
    isConnecting: false,
    activeElections: [],
    upcomingElections: [],
    pastElections: [],
    userVotingPower: "0",
    userTokenBalance: "0",
  });

  const updateState = useCallback((newState) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []);

  const loadUserData = useCallback(async (address) => {
    if (!address) return;
    
    try {
      const [balance, votingPower] = await Promise.all([
        contractManager.getTokenBalance(address),
        contractManager.getVotingPower(address),
      ]);

      updateState({
        userTokenBalance: balance,
        userVotingPower: votingPower,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [updateState]);

  const checkConnection = useCallback(async () => {
    try {
      // ContractManager now handles initialization automatically
      const walletInfo = await contractManager.autoConnectWallet();
      
      if (walletInfo?.address) {
        updateState({
          account: walletInfo.address,
          wallet: walletInfo,
          isConnected: true,
        });
        await loadUserData(walletInfo.address);
      }
    } catch (error) {
      console.error("Connection check failed:", error);
    }
  }, [updateState, loadUserData]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const switchAccount = async (index) => {
    try {
      updateState({ isConnecting: true, error: null });
      
      const account = await contractManager.switchAccount(index);
      
      updateState({
        account: account.address,
        wallet: account,
        isConnected: true,
        isConnecting: false,
      });

      await loadUserData(account.address);
    } catch (error) {
      updateState({
        error: error.message,
        isConnecting: false,
      });
      throw error;
    }
  };

  const disconnectWallet = () => {
    updateState({
      account: null,
      wallet: null,
      isConnected: false,
      userVotingPower: "0",
      userTokenBalance: "0",
    });
    navigate("/");
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

        await Promise.all([loadElectionData(), loadUserData(state.wallet.address)]);
      } catch (error) {
        updateState({ error: "Voting failed" });
        throw error;
      } finally {
        updateState({ loading: false });
      }
    },
  };

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

  const utilityHandlers = {
    refreshData: async () => {
      await Promise.all([loadUserData(state.wallet.address), loadElectionData()]);
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

  const value = {
    ...state,
    switchAccount,
    disconnectWallet,
    ...electionHandlers,
    ...queryHandlers,
    ...utilityHandlers,
  };

  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  );
}
