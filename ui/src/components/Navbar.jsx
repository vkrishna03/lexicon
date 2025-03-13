import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ wallet }) {
  const location = useLocation();

  return (
    <nav className="bg-gray-800 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">Blockchain Voting</Link>
          
          <div className="flex items-center">
            {wallet && (
              <div className="mr-4 text-sm bg-gray-700 rounded-full px-3 py-1">
                {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
              </div>
            )}
            
            <div className="space-x-4">
              {wallet ? (
                <Link 
                  to="/elections"
                  className={`hover:text-blue-300 ${location.pathname === '/elections' ? 'text-blue-300 font-medium' : ''}`}
                >
                  Elections
                </Link>
              ) : (
                <Link 
                  to="/"
                  className={`hover:text-blue-300 ${location.pathname === '/' ? 'text-blue-300 font-medium' : ''}`}
                >
                  Connect Wallet
                </Link>
              )}
              
              {wallet && (
                <Link 
                  to="/create-election"
                  className={`hover:text-blue-300 ${location.pathname === '/create-election' ? 'text-blue-300 font-medium' : ''}`}
                >
                  Create Election
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;