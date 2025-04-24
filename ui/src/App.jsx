import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./contexts/Web3Context";

import Navbar from "./components/Navbar";
import ConnectWallet from "./pages/ConnectWallet";
import CreateElection from "./pages/CreateElection";
import ElectionList from "./pages/ElectionList";
import Nominate from "./pages/Nominate";
import Results from "./pages/Results";
import Vote from "./pages/Vote";
import SetupContracts from "./pages/SetupContracts";
import TokenAllocation from "./pages/TokenAllocationPage";
import ContractTest from "./pages/ContractTest";
import { VotingProvider } from "./contexts/VotingContext";

function App() {
  return (
    <Router>
      <VotingProvider>
        <Web3Provider>
          <div className="min-h-screen bg-gray-100">
            <AppContent />
          </div>
        </Web3Provider>
      </VotingProvider>
    </Router>
  );
}

function AppContent() {
  const { account } = useWeb3();

  return (
    <>
      <Navbar wallet={account} />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<ConnectWallet />} />
          <Route path="/elections" element={<ElectionList />} />
          <Route path="/create-election" element={<CreateElection />} />
          <Route path="/nominate/:electionId" element={<Nominate />} />
          <Route path="/vote/:electionId" element={<Vote />} />
          <Route path="/results/:electionId" element={<Results />} />
          <Route path="/setup" element={<SetupContracts />} />
          <Route path="/tokens" element={<TokenAllocation />} />
          <Route path="/contract-test" element={<ContractTest />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
