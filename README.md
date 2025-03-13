# lexicon


## Blockchain Voting Application

This project is a blockchain-based voting application that allows users to create elections, nominate candidates, register voters, and cast votes using smart contracts deployed on a local Ethereum network.

## Project Structure

- **contracts/**: Contains the Solidity smart contracts.
  - **voting/TokenVoting.sol**: The main contract for managing elections, including creating elections, nominating candidates, registering voters, and casting votes.
  - **tokens/VotingToken.sol**: An ERC20 token contract used for voting.

- **scripts/**: Contains the scripts for deploying and interacting with the contracts.
  - **deploy.ts**: Script to deploy the `VotingToken` and `TokenVoting` contracts.
  - **voting.ts**: Script to simulate an election process, including creating an election, nominating candidates, registering voters, and casting votes.

- **hardhat.config.ts**: Configuration file for Hardhat, specifying the Solidity version and network settings.

- **package.json**: Contains the project dependencies and scripts.

## Application Flow

1. **Deployment**: The `deploy.ts` script deploys the `VotingToken` and `TokenVoting` contracts to a local Ethereum network.

2. **Election Setup**: The `voting.ts` script sets up an election by:
   - Transferring tokens to voters.
   - Creating an election with a start and end time.
   - Approving token spending for voting.

3. **Candidate Nomination**: Candidates are nominated just before the election starts.

4. **Voting Process**: Voters register and cast their votes during the election period.

5. **Election Results**: After the election ends, the results are retrieved and displayed.

## Running the Application

1. **Install Dependencies**: Run `npm install` to install the necessary packages.

2. **Compile Contracts**: Use Hardhat to compile the contracts with `npx hardhat compile`.

3. **Deploy Contracts**: Deploy the contracts using the `deploy.ts` script:
   ```bash
   npx hardhat run scripts/deploy.ts
   ```

4. **Run Voting Script**: Execute the `voting.ts` script to simulate the election process:
   ```bash
   npx hardhat run scripts/voting.ts
   ```

## Integrating with a UI

To integrate this application with a UI, you can follow these steps:

1. **Frontend Framework**: Use a frontend framework like React or Angular to build the UI.

2. **Web3 Integration**: Use a library like `ethers.js` or `web3.js` to interact with the deployed contracts from the frontend.

3. **Contract Addresses**: Use the contract addresses obtained from the deployment scripts to interact with the contracts.

4. **User Interaction**: Implement UI components for creating elections, nominating candidates, registering voters, and casting votes.

5. **Display Results**: Fetch and display the election results on the UI after the election ends.

## Notes

- Ensure that your local Ethereum network is running when executing the scripts.
- Update the Hardhat configuration with your network settings if deploying to a testnet or mainnet.
