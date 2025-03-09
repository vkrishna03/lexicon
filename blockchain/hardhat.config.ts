import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // sepolia: {
    //   url: "https://eth-sepolia.alchemyapi.io/v2/YOUR_ALCHEMY_API_KEY",
    //   accounts: ["YOUR_PRIVATE_KEY"],
    // },
  },
};

export default config;
