import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../Hooks/useAuth";
import { RotatingLines } from "react-loader-spinner"; // Optional loader

const PrivateRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth(); // Get user, loading, and isAdmin from useAuth

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RotatingLines strokeColor="purple" strokeWidth="5" animationDuration="0.75" width="50" visible={true} />
      </div>
    ); // Show loading while Firebase resolves the auth state
  }

  // If the user is not logged in or not an admin, redirect to the login page
  if (!user || !isAdmin) {
    return <Navigate to="/login" />;
  }

  // If authenticated and isAdmin, render the children (private content)
  return children;
};

export default PrivateRoute;
