const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy VotingToken
  const VotingToken = await hre.ethers.getContractFactory("VotingToken");
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 million tokens
  const votingToken = await VotingToken.deploy(initialSupply);
  await votingToken.waitForDeployment();
  const votingTokenAddress = await votingToken.getAddress();
  console.log("VotingToken deployed to:", votingTokenAddress);

  // Deploy VotingSystem
  const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");
  const votingSystem = await VotingSystem.deploy(votingTokenAddress);
  await votingSystem.waitForDeployment();
  const votingSystemAddress = await votingSystem.getAddress();
  console.log("VotingSystem deployed to:", votingSystemAddress);

  // Save addresses to a file
  const addresses = {
    votingToken: votingTokenAddress,
    votingSystem: votingSystemAddress,
  };

  // Save to multiple locations for different uses
  const locations = [
    path.join(__dirname, "../../ui/src/contractAddresses.json"),
    path.join(__dirname, "../deployment/addresses.json"),
  ];

  locations.forEach((filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
    console.log(`Contract addresses saved to ${filePath}`);
  });

  // Setup initial test accounts with tokens
  const accounts = await hre.ethers.getSigners();
  for (let i = 1; i < 10; i++) {
    await votingToken.transfer(
      accounts[i].address,
      hre.ethers.parseEther("1000"),
    );
    console.log(
      `Transferred 1000 tokens to account ${i}: ${accounts[i].address}`,
    );
  }

  // Grant tokens to VotingSystem contract for operations
  await votingToken.transfer(
    votingSystemAddress,
    hre.ethers.parseEther("100000"),
  );
  console.log("Transferred initial tokens to VotingSystem contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
