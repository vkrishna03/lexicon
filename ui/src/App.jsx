import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ConnectWallet from './pages/ConnectWallet';
import CreateElection from './pages/CreateElection';
import ElectionList from './pages/ElectionList';
import Nominate from './pages/Nominate';
import Results from './pages/Results';
import Vote from './pages/Vote';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar wallet={null} />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<ConnectWallet />} />
            <Route path="/elections" element={<ElectionList />} />
            <Route path="/create-election" element={<CreateElection />} />
            <Route path="/nominate/:electionId" element={<Nominate />} />
            <Route path="/vote/:electionId" element={<Vote />} />
            <Route path="/results/:electionId" element={<Results />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
