// components/Header.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import Logo from "../assets/Logo";
import { useVoting } from "../contexts/useVoting";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isConnected, switchAccount, userTokenBalance } = useVoting();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isActivePath = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const accountCount = 5;

  return (
    <header className="fixed top-7 sm:left-1 sm:right-1 xl:left-100 xl:right-100 h-16 px-6 bg-[var(--bg-primary)] z-50 backdrop-blur-sm bg-opacity-80 rounded-4xl shadow-lg">
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between px-2">
        <Logo className="h-8 w-auto" />
        <div className="flex items-center gap-12">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {[{ path: "/elections", label: "Elections" }].map(
              ({ path, label }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`py-1 relative ${
                    isActivePath(path)
                      ? "text-[var(--text-primary)]"
                      : "text-gray-500 hover:text-[var(--text-primary)]"
                  } transition-colors`}
                >
                  {label}
                  {isActivePath(path) && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--text-primary)] rounded-full" />
                  )}
                </button>
              ),
            )}
          </nav>

          {isConnected ? (
            <div className="flex items-center space-x-4">
              {/* Balance display */}
              <div className="rounded-full px-3 py-1 text-sm hidden md:block">
                {userTokenBalance} VOTE
              </div>

              {/* Account dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center hover:bg-black/10 rounded-full px-3 py-1.5 transition-colors text-sm"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm mr-2">
                    {account.substring(0, 6)}...
                    {account.substring(account.length - 4)}
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-1 w-auto min-w-[180px] text-gray-800 z-50 overflow-hidden">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      Switch Account
                    </div>
                    <div className="py-1">
                      {Array.from({ length: accountCount }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            switchAccount(index);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col transition-colors rounded-md"
                        >
                          <span className="font-medium">
                            Account {index + 1}
                          </span>
                          <span className="text-xs text-gray-500">
                            0x{Math.random().toString(16).substring(2, 8)}...
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="bg-[var(--text-primary)] hover:opacity-90 text-white text-sm font-medium py-1.5 px-4 rounded-full transition-opacity"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
