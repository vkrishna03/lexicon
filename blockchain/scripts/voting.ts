import { ethers, network } from "hardhat";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mineBlockWithTimestamp(timestamp: number) {
  await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await network.provider.send("evm_mine");
  const block = await ethers.provider.getBlock("latest");
  if (!block) throw new Error("Failed to get block");
  console.log(
    `Mined block with timestamp: ${block.timestamp} (${new Date(
      block.timestamp * 1000
    ).toLocaleString()})`
  );
  return block.timestamp;
}

async function main() {
  console.log("Deploying contracts...");

  // Deploy VotingToken
  const VotingToken = await ethers.getContractFactory("VotingToken");
  const votingToken = await VotingToken.deploy(ethers.parseEther("1000000"));
  await votingToken.waitForDeployment();
  const votingTokenAddress = await votingToken.getAddress();
  console.log("VotingToken deployed to:", votingTokenAddress);

  // Deploy TokenVoting
  const TokenVoting = await ethers.getContractFactory("TokenVoting");
  const tokenVoting = await TokenVoting.deploy(votingTokenAddress);
  await tokenVoting.waitForDeployment();
  const tokenVotingAddress = await tokenVoting.getAddress();
  console.log("TokenVoting deployed to:", tokenVotingAddress);

  // Get signers
  const [, voter1, voter2, candidate1, candidate2] = await ethers.getSigners();

  console.log("\nSetting up election...");

  // Transfer tokens to voters
  console.log("Transferring tokens to voters...");
  await votingToken.transfer(voter1.address, ethers.parseEther("100"));
  await votingToken.transfer(voter2.address, ethers.parseEther("100"));
  console.log("Transferred tokens to voters");

  // Get current block
  const currentBlock = await ethers.provider.getBlock("latest");
  if (!currentBlock) throw new Error("Failed to get current block");
  console.log(
    `Current block timestamp: ${currentBlock.timestamp} (${new Date(
      currentBlock.timestamp * 1000
    ).toLocaleString()})`
  );

  // Set election times
  const startTime = currentBlock.timestamp + 30; // Start in 30 seconds
  const endTime = startTime + 300; // Run for 5 minutes

  console.log(`\nPlanned election times:`);
  console.log(
    `Start time: ${startTime} (${new Date(startTime * 1000).toLocaleString()})`
  );
  console.log(
    `End time: ${endTime} (${new Date(endTime * 1000).toLocaleString()})`
  );

  // Create election
  console.log("\nCreating election...");
  const createElectionTx = await tokenVoting.createElection(
    "Test Election",
    startTime,
    endTime
  );
  const receipt = await createElectionTx.wait();

  // Extract electionId from events
  let electionId = 1n; // Default to 1 if not found
  if (receipt && receipt.logs) {
    const event = receipt.logs
      .map((log) => {
        try {
          return tokenVoting.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event?.name === "ElectionCreated");

    if (event && event.args.electionId) {
      electionId = event.args.electionId;
    }
  }
  console.log("Created Election with ID:", electionId.toString());

  // Approve token spending
  console.log("\nApproving token spending...");
  await votingToken
    .connect(voter1)
    .approve(tokenVotingAddress, ethers.parseEther("100"));
  await votingToken
    .connect(voter2)
    .approve(tokenVotingAddress, ethers.parseEther("100"));
  console.log("Approved token spending");

  // Move time to just before election start and nominate candidates
  console.log("\nNominating candidates...");
  await mineBlockWithTimestamp(startTime - 5);
  await tokenVoting.connect(candidate1).nominate(electionId, 1);
  await tokenVoting.connect(candidate2).nominate(electionId, 2);
  console.log("Candidates nominated");

  // Move time to start of election
  console.log("\nMoving time to start of election...");
  await mineBlockWithTimestamp(startTime + 1);

  // Register voters
  console.log("\nRegistering voters...");
  await tokenVoting.connect(voter1).registerVoter(electionId);
  await tokenVoting.connect(voter2).registerVoter(electionId);
  console.log("Voters registered");

  // Cast votes
  console.log("\nCasting votes...");
  await tokenVoting.connect(voter1).vote(electionId, 1);
  await tokenVoting.connect(voter2).vote(electionId, 2);
  console.log("Votes cast");

  // Move time to after election end
  console.log("\nMoving time to after election end...");
  await mineBlockWithTimestamp(endTime + 10);

  // Deactivate election
  console.log("\nDeactivating election...");
  await tokenVoting.deactivateElection(electionId);

  // Get results
  console.log("\nGetting election results...");
  try {
    const results = await tokenVoting.getResults(electionId);
    console.log("\nElection Results:");

    // Handle different possible return types
    if (Array.isArray(results)) {
      results.forEach((votes: bigint, index: number) => {
        console.log(
          `Candidate ${index + 1}: ${ethers.formatEther(votes)} votes`
        );
      });
    } else {
      console.log("Unexpected results format:", results);
    }
  } catch (error) {
    console.error("Error getting results:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
