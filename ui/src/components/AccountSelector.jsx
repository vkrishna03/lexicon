import React from "react";
import { useVoting } from "../contexts/useVoting";

function AccountSelector({ onClose }) {
  const { account, switchAccount, isConnecting } = useVoting();

  const handleAccountSwitch = async (index) => {
    try {
      await switchAccount(index);
      onClose?.();
    } catch (error) {
      console.error("Failed to switch account:", error);
    }
  };

  // Hardhat provides 20 accounts by default, but we'll show first 4 for simplicity
  const accountCount = 4;

  return (
    <div className="w-64">
      <h3 className="text-gray-700 font-medium mb-2">Switch Account</h3>
      <div className="space-y-2">
        {Array.from({ length: accountCount }).map((_, index) => (
          <button
            key={index}
            onClick={() => handleAccountSwitch(index)}
            disabled={isConnecting}
            className={`w-full text-left px-3 py-2 rounded text-sm ${
              account === `Account ${index}` 
                ? "bg-blue-50 text-blue-700" 
                : "hover:bg-gray-50"
            }`}
          >
            Account {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AccountSelector;
