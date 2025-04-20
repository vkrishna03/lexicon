const fs = require("fs");
const path = require("path");

async function main() {
  // Generate mock addresses
  const votingTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tokenVotingAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log("Mock VotingToken address:", votingTokenAddress);
  console.log("Mock TokenVoting address:", tokenVotingAddress);

  // Save addresses to a file
  const addresses = {
    votingToken: votingTokenAddress,
    tokenVoting: tokenVotingAddress,
  };

  // Ensure the directory exists
  const uiDir = path.join(__dirname, "../../ui/src");
  if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir, { recursive: true });
  }

  const addressesFilePath = path.join(uiDir, "contractAddresses.json");
  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));

  console.log(`Mock contract addresses saved to ${addressesFilePath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
