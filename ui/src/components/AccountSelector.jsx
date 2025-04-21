import React from "react";
import { useWeb3 } from "../contexts/Web3Context";

function AccountSelector() {
  const { account, availableAccounts, switchAccount } = useWeb3();

  const handleAccountChange = (e) => {
    const accountIndex = parseInt(e.target.value);
    switchAccount(accountIndex);
  };

  if (!availableAccounts || availableAccounts.length === 0) {
    return <div className="text-red-500">No accounts available</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        value={availableAccounts.findIndex((acc) => acc.address === account)}
        onChange={handleAccountChange}
      >
        {availableAccounts.map((acc, index) => (
          <option key={acc.address} value={index}>
            Account {index}: {acc.address.substring(0, 6)}...
            {acc.address.substring(acc.address.length - 4)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AccountSelector;
