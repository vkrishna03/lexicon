import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { VotingProvider } from "./contexts/VotingContext";
import Navbar from "./components/Navbar";
import ElectionList from "./pages/ElectionList";
import CreateElection from "./pages/CreateElection";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import Nominate from "./pages/Nominate";
import "./App.css";

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/elections" replace />} />
          <Route path="/elections" element={<ElectionList />} />
          <Route path="/create-election" element={<CreateElection />} />
          <Route path="/vote/:electionId" element={<Vote />} />
          <Route path="/results/:electionId" element={<Results />} />
          <Route path="/nominate/:electionId" element={<Nominate />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <VotingProvider>
        <AppContent />
      </VotingProvider>
    </Router>
  );
}

export default App;
