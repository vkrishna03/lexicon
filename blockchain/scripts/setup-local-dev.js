const { spawn } = require("child_process");
const path = require("path");

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}

async function main() {
  try {
    // Clean up any existing deployments
    console.log("Cleaning up previous deployments...");
    await runCommand("npx", ["hardhat", "clean"]);

    // Compile contracts
    console.log("\nCompiling contracts...");
    await runCommand("npx", ["hardhat", "compile"]);

    // Start Hardhat node in the background
    console.log("\nStarting Hardhat node...");
    const hardhatNode = spawn("npx", ["hardhat", "node"], {
      stdio: "inherit",
      shell: true,
    });

    // Wait for node to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Deploy contracts
    console.log("\nDeploying contracts...");
    await runCommand("npx", [
      "hardhat",
      "run",
      "--network",
      "localhost",
      "scripts/deploy-and-output.js",
    ]);

    console.log("\n🚀 Development environment is ready!");
    console.log("\nAvailable accounts:");
    console.log("Account #0: Contract Owner & Token Holder");
    console.log("Accounts #1-#9: Test users with 1000 tokens each");
    console.log("\nNetwork: http://localhost:8545");
    console.log(
      "\nKeep this terminal running and start your UI application in a new terminal.",
    );

    // Keep the script running
    process.on("SIGINT", () => {
      console.log("\nShutting down development environment...");
      hardhatNode.kill();
      process.exit();
    });
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

main();
