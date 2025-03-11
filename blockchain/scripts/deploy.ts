import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy VotingToken
  const VotingToken = await ethers.getContractFactory("VotingToken");
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const votingToken = await VotingToken.deploy(initialSupply);
  await votingToken.waitForDeployment();
  const votingTokenAddress = await votingToken.getAddress();
  console.log("VotingToken deployed to:", votingTokenAddress);

  // Deploy TokenVoting
  const TokenVoting = await ethers.getContractFactory("TokenVoting");
  const tokenVoting = await TokenVoting.deploy(votingTokenAddress);
  await tokenVoting.waitForDeployment();
  const tokenVotingAddress = await tokenVoting.getAddress();
  console.log("TokenVoting deployed to:", tokenVotingAddress);

  // Save the addresses for the interaction script
  console.log("\nAdd these addresses to your interaction script:");
  console.log(`VotingToken: ${votingTokenAddress}`);
  console.log(`TokenVoting: ${tokenVotingAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 