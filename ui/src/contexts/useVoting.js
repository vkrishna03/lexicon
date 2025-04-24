import { useContext } from 'react';
import { VotingContext } from './votingContextDefs.js';

export function useVoting() {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error("useVoting must be used within a VotingProvider");
  }
  return context;
}