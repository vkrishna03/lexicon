import React from "react";

function TransactionStatus({ tx, description }) {
  if (!tx) return null;

  return (
    <div className="mt-4">
      <p className="font-medium">{description || "Transaction"}</p>
      <p className="text-sm">
        {tx.status === "pending" && (
          <span className="text-yellow-600">
            Pending...{" "}
            <a
              href={`https://etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </span>
        )}
        {tx.status === "confirmed" && (
          <span className="text-green-600">
            Confirmed!{" "}
            <a
              href={`https://etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </span>
        )}
        {tx.status === "failed" && (
          <span className="text-red-600">Failed: {tx.error}</span>
        )}
      </p>
    </div>
  );
}

export default TransactionStatus;
