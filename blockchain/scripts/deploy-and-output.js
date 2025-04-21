const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy VotingToken
  const VotingToken = await hre.ethers.getContractFactory("VotingToken");
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 million tokens
  const votingToken = await VotingToken.deploy(initialSupply);
  await votingToken.waitForDeployment();
  const votingTokenAddress = await votingToken.getAddress();
  console.log("VotingToken deployed to:", votingTokenAddress);

  // Deploy TokenVoting
  const TokenVoting = await hre.ethers.getContractFactory("TokenVoting");
  const tokenVoting = await TokenVoting.deploy(votingTokenAddress);
  await tokenVoting.waitForDeployment();
  const tokenVotingAddress = await tokenVoting.getAddress();
  console.log("TokenVoting deployed to:", tokenVotingAddress);

  // Save addresses to a file
  const addresses = {
    votingToken: votingTokenAddress,
    tokenVoting: tokenVotingAddress,
  };

  const addressesFilePath = path.join(
    __dirname,
    "../../ui/src/contractAddresses.json",
  );
  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));

  console.log(`Contract addresses saved to ${addressesFilePath}`);

  // Transfer some tokens to other accounts for testing
  const accounts = await hre.ethers.getSigners();

  for (let i = 1; i < 5; i++) {
    await votingToken.transfer(
      accounts[i].address,
      hre.ethers.parseEther("1000"),
    );
    console.log(
      `Transferred 1000 tokens to account ${i}: ${accounts[i].address}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
