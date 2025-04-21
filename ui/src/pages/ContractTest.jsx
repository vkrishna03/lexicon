import React, { useState } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { ethers } from "ethers";
import { Link } from "react-router-dom";

function ContractTest() {
  const { account, contracts, provider } = useWeb3();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testElectionId, setTestElectionId] = useState(1);

  const addLog = (message) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testGetElectionDirectly = async () => {
    setLoading(true);
    try {
      addLog(`Directly accessing election with ID ${testElectionId}...`);

      if (!contracts.tokenVoting) {
        throw new Error("TokenVoting contract not initialized");
      }

      // Try to directly access the election data structure
      // This depends on how your contract actually stores elections
      addLog("Getting election name...");
      const name = await contracts.tokenVoting.getElementFromElection(
        testElectionId,
        "name",
      );
      addLog(`Election name: ${name}`);

      addLog("Getting election start time...");
      const startTime = await contracts.tokenVoting.getElementFromElection(
        testElectionId,
        "startTime",
      );
      addLog(`Start time: ${startTime}`);

      addLog("Getting election end time...");
      const endTime = await contracts.tokenVoting.getElementFromElection(
        testElectionId,
        "endTime",
      );
      addLog(`End time: ${endTime}`);

      addLog("Getting isActive flag...");
      const isActive = await contracts.tokenVoting.getElementFromElection(
        testElectionId,
        "isActive",
      );
      addLog(`Is active: ${isActive}`);

      // Try to access the candidates mapping
      addLog("Checking candidates...");
      const isCandidate1 = await contracts.tokenVoting
        .elections(testElectionId)
        .candidates(1);
      addLog(`Is 1 a candidate? ${isCandidate1}`);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testElectionCount = async () => {
    setLoading(true);
    try {
      addLog("Testing election count...");

      if (!contracts.tokenVoting) {
        throw new Error("TokenVoting contract not initialized");
      }

      const count = await contracts.tokenVoting.electionCount();
      addLog(`Election count: ${count.toString()}`);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestElection = async () => {
    setLoading(true);
    try {
      addLog("Creating test election...");

      if (!contracts.tokenVoting) {
        throw new Error("TokenVoting contract not initialized");
      }

      // Create election that starts 1 minute from now and lasts 1 hour
      const startTime = Math.floor(Date.now() / 1000) + 60;
      const endTime = startTime + 3600;

      addLog(`Start time: ${startTime}, End time: ${endTime}`);

      const tx = await contracts.tokenVoting.createElection(
        "Test Election",
        startTime,
        endTime,
      );

      addLog("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      addLog(`Transaction confirmed! Gas used: ${receipt.gasUsed.toString()}`);

      // Check the new count
      const newCount = await contracts.tokenVoting.electionCount();
      addLog(`New election count: ${newCount.toString()}`);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetElection = async () => {
    setLoading(true);
    try {
      addLog(`Getting election with ID ${testElectionId}...`);

      if (!contracts.tokenVoting) {
        throw new Error("TokenVoting contract not initialized");
      }

      const election = await contracts.tokenVoting.elections(testElectionId);
      addLog("Election data:");
      addLog(`- Name: ${election.name}`);
      addLog(
        `- Start Time: ${election.startTime.toString()} (${new Date(Number(election.startTime) * 1000).toLocaleString()})`,
      );
      addLog(
        `- End Time: ${election.endTime.toString()} (${new Date(Number(election.endTime) * 1000).toLocaleString()})`,
      );
      addLog(`- Total Votes: ${election.totalVotes.toString()}`);
      addLog(`- Is Active: ${election.isActive}`);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNominateCandidate = async () => {
    setLoading(true);
    try {
      addLog(`Nominating candidate for election ${testElectionId}...`);

      if (!contracts.tokenVoting) {
        throw new Error("TokenVoting contract not initialized");
      }

      // Nominate candidate with ID 1
      const tx = await contracts.tokenVoting.nominate(testElectionId, 1);

      addLog("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      addLog(`Nomination confirmed! Gas used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTokenBalance = async () => {
    setLoading(true);
    try {
      addLog("Checking token balance...");

      if (!contracts.votingToken) {
        throw new Error("VotingToken contract not initialized");
      }

      const balance = await contracts.votingToken.balanceOf(account);
      addLog(`Token balance: ${ethers.formatEther(balance)} VOTE`);
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Contract Testing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Contract Status</h2>
          <p className="mb-2">
            <span className="font-medium">Connected Account:</span>{" "}
            {account
              ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
              : "Not connected"}
          </p>
          <p className="mb-2">
            <span className="font-medium">VotingToken Contract:</span>{" "}
            {contracts?.votingToken ? "Connected" : "Not connected"}
          </p>
          <p className="mb-2">
            <span className="font-medium">TokenVoting Contract:</span>{" "}
            {contracts?.tokenVoting ? "Connected" : "Not connected"}
          </p>

          {(!contracts?.votingToken || !contracts?.tokenVoting) && (
            <div className="mt-4">
              <Link
                to="/setup"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded block text-center"
              >
                Go to Setup Page
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Test Operations</h2>

          <div className="space-y-2">
            <button
              onClick={testElectionCount}
              disabled={loading || !contracts?.tokenVoting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
            >
              Test Election Count
            </button>

            <button
              onClick={createTestElection}
              disabled={loading || !contracts?.tokenVoting}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-green-300"
            >
              Create Test Election
            </button>

            <div className="flex space-x-2">
              <input
                type="number"
                value={testElectionId}
                onChange={(e) => setTestElectionId(Number(e.target.value))}
                min="1"
                className="w-16 border rounded px-2 py-2"
              />
              <button
                onClick={testGetElection}
                disabled={loading || !contracts?.tokenVoting}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded disabled:bg-purple-300"
              >
                Get Election
              </button>
            </div>

            <button
              onClick={testNominateCandidate}
              disabled={loading || !contracts?.tokenVoting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded disabled:bg-yellow-300"
            >
              Nominate Candidate
            </button>

            <button
              onClick={checkTokenBalance}
              disabled={loading || !contracts?.votingToken}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded disabled:bg-indigo-300"
            >
              Check Token Balance
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Execution Logs</h2>
          <button
            onClick={clearLogs}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded"
          >
            Clear Logs
          </button>
        </div>
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No logs yet. Run a test operation to see results.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                &gt; {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ContractTest;
