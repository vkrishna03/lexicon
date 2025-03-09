import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  // Load Ignition deployment output
  const deploymentPath = path.join(
    __dirname,
    "../ignition/deployments/localhost/VotingModule.json"
  );
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      "Deployment file not found. Make sure the contract is deployed using Ignition."
    );
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  // Get deployed contract addresses
  const votingTokenAddress = deploymentData["VotingToken"].address;
  const tokenVotingAddress = deploymentData["TokenVoting"].address;

  console.log(`VotingToken deployed at: ${votingTokenAddress}`);
  console.log(`TokenVoting deployed at: ${tokenVotingAddress}`);

  // Get contract instances
  const votingToken = await ethers.getContractAt(
    "VotingToken",
    votingTokenAddress
  );
  const tokenVoting = await ethers.getContractAt(
    "TokenVoting",
    tokenVotingAddress
  );

  // Check token details
  console.log(`Token Name: ${await votingToken.name()}`);
  console.log(`Token Symbol: ${await votingToken.symbol()}`);
  console.log(
    `Total Supply: ${ethers.formatEther(await votingToken.totalSupply())}`
  );

  // Example interaction: Create an election
  const tx = await tokenVoting.createElection(
    "Presidential Election",
    1700000000,
    1800000000
  );
  await tx.wait();
  console.log("Election created successfully!");

  // Fetch and print election details
  const election = await tokenVoting.elections(1);
  console.log(`Election Name: ${election.name}`);
}

// Execute script with Hardhat
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
