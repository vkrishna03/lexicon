import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";

function ConnectWallet() {
  const {
    account,
    connectWallet,
    isConnecting,
    error,
    availableAccounts,
    currentAddresses,
  } = useWeb3();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (account) {
      navigate("/elections");
    }
  }, [account, navigate]);

  const handleConnect = async (index) => {
    try {
      await connectWallet(index);
    } catch (err) {
      console.error("Connection error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          Decentralized Voting System
        </h1>

        {account ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Connected: {account.substring(0, 6)}...
              {account.substring(account.length - 4)}
            </div>
            <button
              onClick={() => navigate("/elections")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              View Elections
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Connect using a local Hardhat account to access the voting
              platform.
            </p>

            {/* Contract status section */}
            <div className="mb-6 border p-4 rounded bg-gray-50">
              <h3 className="font-bold mb-2">Contract Status:</h3>
              <p className="text-sm mb-2">
                Token Contract: {currentAddresses.votingToken || "Not set"}
              </p>
              <p className="text-sm mb-2">
                Voting Contract: {currentAddresses.tokenVoting || "Not set"}
              </p>
              {(!currentAddresses.votingToken ||
                !currentAddresses.tokenVoting) && (
                <div className="mt-3">
                  <Link
                    to="/setup"
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded block text-center"
                  >
                    Set Up Contracts First
                  </Link>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={() => handleConnect(0)}
              disabled={
                isConnecting ||
                availableAccounts.length === 0 ||
                !currentAddresses.votingToken
              }
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300 mb-4"
            >
              {isConnecting ? "Connecting..." : "Connect with Default Account"}
            </button>

            {availableAccounts.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Or select a specific account:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableAccounts.slice(0, 4).map((account, index) => (
                    <button
                      key={account.address}
                      onClick={() => handleConnect(index)}
                      disabled={isConnecting || !currentAddresses.votingToken}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-3 rounded disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Account {index}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center text-sm text-red-500">
                No accounts available. Make sure your Hardhat node is running.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectWallet;
