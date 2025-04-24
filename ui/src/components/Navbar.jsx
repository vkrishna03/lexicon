import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useVoting } from "../contexts/useVoting";
import AccountSelector from "./AccountSelector";

function Navbar() {
  const { account, isConnected } = useVoting();
  const [showAccountModal, setShowAccountModal] = useState(false);

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">
            Blockchain Voting
          </Link>

          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                <div 
                  className="flex items-center cursor-pointer bg-gray-700 rounded-full px-3 py-1"
                  onClick={() => setShowAccountModal(!showAccountModal)}
                >
                  <span className="text-sm mr-2">
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <Link to="/elections" className="hover:text-blue-300">
                  Elections
                </Link>
                {showAccountModal && (
                  <div className="absolute right-4 top-16 mt-2 bg-white rounded-lg shadow-xl p-4 z-50">
                    <AccountSelector onClose={() => setShowAccountModal(false)} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
