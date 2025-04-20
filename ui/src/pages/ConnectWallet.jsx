import React from "react";
import { useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";

function ConnectWallet() {
  const { account, connectWallet, isConnecting, error, availableAccounts } =
    useWeb3();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (account) {
      navigate("/elections");
    }
  }, [account, navigate]);

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

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <button
              onClick={() => connectWallet(0)}
              disabled={isConnecting || availableAccounts.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300 mb-4"
            >
              {isConnecting ? "Connecting..." : "Connect with Default Account"}
            </button>

            {availableAccounts.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Or select a specific account:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableAccounts.slice(0, 4).map((account, index) => (
                    <button
                      key={account.address}
                      onClick={() => connectWallet(index)}
                      disabled={isConnecting}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 px-3 rounded"
                    >
                      Account {index}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectWallet;
