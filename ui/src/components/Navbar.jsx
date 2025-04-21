import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import AccountSelector from "./AccountSelector";

function Navbar() {
  const { account } = useWeb3();
  const location = useLocation();

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">
            Blockchain Voting
          </Link>

          <div className="flex items-center">
            {account && (
              <div className="mr-4 text-sm bg-gray-700 rounded-full px-3 py-1">
                {account.substring(0, 6)}...
                {account.substring(account.length - 4)}
                <AccountSelector />
              </div>
            )}

            <div className="space-x-4">
              {account ? (
                <Link
                  to="/elections"
                  className={`hover:text-blue-300 ${location.pathname === "/elections" ? "text-blue-300 font-medium" : ""}`}
                >
                  Elections
                </Link>
              ) : (
                <Link
                  to="/"
                  className={`hover:text-blue-300 ${location.pathname === "/" ? "text-blue-300 font-medium" : ""}`}
                >
                  Connect Wallet
                </Link>
              )}
              

              <Link
                to="/setup"
                className={`hover:text-blue-300 ${location.pathname === "/setup" ? "text-blue-300 font-medium" : ""}`}
              >
                Setup
              </Link>

              <Link
                to="/contract-test"
                className={`hover:text-blue-300 ${location.pathname === "/contract-test" ? "text-blue-300 font-medium" : ""}`}
              >
                Contract Test
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
