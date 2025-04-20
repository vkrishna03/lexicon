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

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <AppContent />
        </div>
      </Router>
    </Web3Provider>
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
        </Routes>
      </div>
    </>
  );
}

export default App;
