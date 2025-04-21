import { ethers } from "ethers";

export async function testHardhatConnection() {
  try {
    console.log("Testing connection to Hardhat node...");
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");

    // Test connection with network call
    const network = await provider.getNetwork();
    console.log("Successfully connected to network:", network);

    // Get accounts
    const accounts = await provider.listAccounts();
    console.log(
      "Available accounts:",
      accounts.map((acc) => acc.address),
    );

    return {
      success: true,
      message: "Connected successfully",
      network,
      accounts,
    };
  } catch (error) {
    console.error("Failed to connect to Hardhat:", error);
    return {
      success: false,
      message: error.message,
      error,
    };
  }
}
