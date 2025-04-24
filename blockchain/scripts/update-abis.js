const fs = require("fs");
const path = require("path");

// Paths
const artifactsDir = path.join(__dirname, "../artifacts/contracts");
const abiOutputDir = path.join(__dirname, "../../ui/src/abis");

// Ensure output directory exists
if (!fs.existsSync(abiOutputDir)) {
  fs.mkdirSync(abiOutputDir, { recursive: true });
}

// Function to extract ABI
function extractAndSaveABI(contractName) {
  console.log(`Processing ${contractName}...`);

  // Path to artifact JSON
  const artifactPath = path.join(
    artifactsDir,
    `${contractName}.sol/${contractName}.json`
  );

  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact not found: ${artifactPath}`);
    return false;
  }

  try {
    // Read and parse artifact
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Create new file with just the ABI
    const outputPath = path.join(abiOutputDir, `${contractName}.json`);
    fs.writeFileSync(
      outputPath,
      JSON.stringify({ abi: artifact.abi }, null, 2)
    );

    console.log(`ABI saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${contractName}:`, error);
    return false;
  }
}

// Main function to update ABIs
function updateABIs() {
  const contracts = ["VotingSystem", "VotingToken"];
  let success = true;

  for (const contract of contracts) {
    if (!extractAndSaveABI(contract)) {
      success = false;
    }
  }

  if (success) {
    console.log("\nAll ABIs updated successfully!");
  } else {
    console.error("\nThere were errors updating some ABIs.");
  }
}

// Run the update
updateABIs();
