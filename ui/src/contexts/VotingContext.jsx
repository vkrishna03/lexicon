import { useState, useEffect, useCallback, useMemo } from "react";
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

  const loadUserData = useCallback(
    async (address) => {
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
    },
    [updateState],
  );

  const loadElectionData = useCallback(async () => {
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

  // Use useEffect with proper dependencies
  useEffect(() => {
    const initializeApp = async () => {
      await checkConnection();
    };

    initializeApp();
  }, [checkConnection]); // Add checkConnection as a dependency

  // Separate useEffect for loading election data when connected
  useEffect(() => {
    if (state.isConnected) {
      loadElectionData();
    }
  }, [state.isConnected, loadElectionData]); // Add loadElectionData as a dependency

  const switchAccount = useCallback(
    async (index) => {
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
    },
    [updateState, loadUserData],
  );

  const disconnectWallet = useCallback(() => {
    updateState({
      account: null,
      wallet: null,
      isConnected: false,
      userVotingPower: "0",
      userTokenBalance: "0",
    });
    navigate("/");
  }, [updateState, navigate]);

  // Memoize the handlers to prevent recreation on each render
  const electionHandlers = useMemo(
    () => ({
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

          console.log("Election created:", result);

          setTimeout(async () => {
            await loadElectionData();
          }, 2000);
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
            state.account,
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

          await contractManager.updateElectionState(electionId);

          const eligibility = await contractManager.canUserVote(
            electionId,
            state.account,
          );

          if (!eligibility.canVote) {
            throw new Error(eligibility.reason);
          }

          await contractManager.castVote(electionId, candidateId);

          await Promise.all([
            loadElectionData(),
            loadUserData(state.wallet.address),
          ]);
        } catch (error) {
          updateState({ error: "Voting failed" });
          throw error;
        } finally {
          updateState({ loading: false });
        }
      },
    }),
    [updateState, loadElectionData, loadUserData, state.wallet],
  );

  // Memoize the query handlers to prevent recreation on each render
  const queryHandlers = useMemo(
    () => ({
      getElection: async (electionId) => {
        try {
          const [details, candidates, timeStatus] = await Promise.all([
            contractManager.getElectionDetails(electionId),
            contractManager.getAllCandidates(electionId),
            contractManager.getElectionTimeStatus(electionId),
          ]);

          // Add debug log
          console.log("Election timeStatus:", timeStatus);

          return { id: electionId, ...details, candidates, timeStatus };
        } catch (error) {
          console.error("Error fetching election:", error);
          throw error;
        }
      },

      getElections: async () => {
        try {
          updateState({ loading: true });

          // Get active election IDs
          const activeIds = await contractManager.getActiveElections();

          // Fetch details for each election
          const elections = await Promise.all(
            activeIds.map(async (id) => {
              const details = await contractManager.getElectionDetails(id);
              const timeStatus =
                await contractManager.getElectionTimeStatus(id);

              return {
                id,
                title: details.name, // Map 'name' to 'title' for UI compatibility
                description: details.description,
                startDate: details.nominationStart,
                nominationEndDate: details.nominationEnd,
                votingStartDate: details.votingStart,
                endDate: details.votingEnd,
                state: details.state,
                totalVotes: details.totalVotes,
                status: timeStatus.phase, // Use the phase as status
                timeStatus,
              };
            }),
          );

          return elections;
        } catch (error) {
          console.error("Error fetching elections:", error);
          throw error;
        } finally {
          updateState({ loading: false });
        }
      },

      getCandidates: async (electionId) => {
        try {
          const candidates = await contractManager.getAllCandidates(electionId);

          // Map the data to match UI expectations
          return candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            address: candidate.address,
            platform: candidate.manifestoURI, // Map manifestoURI to platform for UI
            voteCount: Number(candidate.voteCount),
          }));
        } catch (error) {
          console.error("Error fetching candidates:", error);
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
    }),
    [updateState, state.wallet],
  );

  // Memoize the utility handlers to prevent recreation on each render
  const utilityHandlers = useMemo(
    () => ({
      refreshData: async () => {
        await Promise.all([
          loadUserData(state.wallet.address),
          loadElectionData(),
        ]);
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
    }),
    [loadUserData, loadElectionData, state.wallet],
  );

  // Memoize context value to prevent recreation on each render
  const value = useMemo(
    () => ({
      ...state,
      switchAccount,
      disconnectWallet,
      ...electionHandlers,
      ...queryHandlers,
      ...utilityHandlers,
    }),
    [
      state,
      switchAccount,
      disconnectWallet,
      electionHandlers,
      queryHandlers,
      utilityHandlers,
    ],
  );

  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  );
}
