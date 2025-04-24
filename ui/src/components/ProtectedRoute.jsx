import React from "react";
import { useVoting } from "../contexts/useVoting";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { isConnected } = useVoting();

  if (!isConnected) {
    return <Navigate to="/" />;
  }

  return children;
}
