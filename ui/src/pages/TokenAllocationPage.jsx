import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";

function TokenAllocation() {
  const { account, contracts, availableAccounts } = useWeb3();
  const [amount, setAmount] = useState("100");
  const [recipient, setRecipient] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const getBalance = async () => {
      if (contracts?.votingToken && account) {
        try {
          const bal = await contracts.votingToken.balanceOf(account);
          setBalance(ethers.formatEther(bal));
        } catch (err) {
          console.error("Error fetching balance:", err);
        }
      }
    };

    getBalance();
  }, [contracts, account]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!contracts?.votingToken) {
      setError("VotingToken contract not initialized");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const tx = await contracts.votingToken.transfer(
        recipient,
        ethers.parseEther(amount),
      );

      await tx.wait();

      setSuccess(
        `Successfully transferred ${amount} tokens to ${recipient.substring(0, 6)}...`,
      );

      // Update balance
      const bal = await contracts.votingToken.balanceOf(account);
      setBalance(ethers.formatEther(bal));

      // Reset form
      setAmount("100");
      setRecipient("");
    } catch (err) {
      console.error("Error transferring tokens:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 mt-10">
      <h2 className="text-xl font-bold mb-4">Token Allocation</h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800">
          Your Balance: <span className="font-bold">{balance} VOTE</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleTransfer}>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="recipient"
          >
            Recipient Address
          </label>
          <select
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Select a recipient</option>
            {availableAccounts.map((acc) => (
              <option key={acc.address} value={acc.address}>
                {acc.address.substring(0, 10)}... (Account{" "}
                {availableAccounts.indexOf(acc)})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            min="1"
            step="1"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !recipient}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
        >
          {loading ? "Processing..." : "Transfer Tokens"}
        </button>
      </form>
    </div>
  );
}

export default TokenAllocation;
