import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_SUPPLY = BigInt(1000000) * BigInt(10)**BigInt(18); // 1 million tokens

export default buildModule("TokenDeployment", async (m) => {
  const votingToken = await m.deploy("VotingToken", [INITIAL_SUPPLY]);

  return { votingToken };
});
