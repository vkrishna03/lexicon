import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingModule", (m) => {
  // Define initial supply parameter for VotingToken
  const initialSupply = m.getParameter<string>(
    "initialSupply",
    "1000000000000000000000000" // 1M tokens (in wei)
  );

  // Deploy VotingToken contract
  const votingToken = m.contract("VotingToken", [initialSupply]);

  // Deploy TokenVoting contract, passing the VotingToken address
  const tokenVoting = m.contract("TokenVoting", [votingToken]);

  return { votingToken, tokenVoting };
});
