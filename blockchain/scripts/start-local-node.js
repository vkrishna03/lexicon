const { spawn } = require("child_process");
const path = require("path");

// Function to run a command in a child process
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // Start Hardhat node in the background
    console.log("Starting Hardhat node...");
    const hardhatNode = spawn("npx", ["hardhat", "node"], {
      stdio: "inherit",
      shell: true,
    });

    // Give the node a moment to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Deploy contracts
    console.log("\nDeploying contracts...");
    await runCommand("npx", [
      "hardhat",
      "run",
      "scripts/deploy-and-output.js",
      "--network",
      "localhost",
    ]);

    console.log("\nSetup complete! Now you can run the UI with:");
    console.log("cd ../ui && npm run dev");

    // Keep the script running to keep the node alive
    console.log("\nHardhat node is running. Press Ctrl+C to stop.");
  } catch (error) {
    console.error("Error during setup:", error);
    process.exit(1);
  }
}

main();
