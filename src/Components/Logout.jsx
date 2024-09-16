import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const LogoutModal = ({ isOpen, onClose }) => {
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login page after signing out
    } catch (error) {
      console.error("Error logging out: ", error);
    }
    onClose(); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Log Out</h3>
        <p className="text-gray-700 mb-6">Are you sure you want to log out?</p>
        <div className="flex justify-end">
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
