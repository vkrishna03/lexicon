import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ConnectWallet({ setWallet, wallet }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function connectWallet() {
    setIsConnecting(true);
    setError('');
    
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Get the first account
          const account = accounts[0];
          setWallet(account);
          
          // Navigate to elections page on successful connection
          navigate('/elections');
        } catch (error) {
          setError('User denied account access');
          console.error(error);
        }
      } else {
        setError('Please install MetaMask to use this application');
      }
    } catch (err) {
      setError('Error connecting wallet: ' + err.message);
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Decentralized Voting System</h1>
        
        {wallet ? (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Connected: {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
            </div>
            <button 
              onClick={() => navigate('/elections')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              View Elections
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Connect your Ethereum wallet to access the decentralized voting platform.
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectWallet;