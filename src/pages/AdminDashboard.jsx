import React, { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore"; // Ensure query and where are imported
import { db } from "../firebase.config";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

import LogoutModal from "../Components/Logout";

const AdminDashboard = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUnapprovedVendors, setTotalUnapprovedVendors] = useState(0);
  const navigate = useNavigate(); // Create navigate hook

  // Function to fetch data from Firestore
  const fetchCounts = async () => {
    try {
      // Fetch total vendors
      const vendorsSnapshot = await getDocs(collection(db, "vendors"));
      setTotalVendors(vendorsSnapshot.size);

      // Fetch total unapproved vendors
      const unapprovedVendorsSnapshot = await getDocs(
        query(collection(db, "vendors"), where("isApproved", "==", false))
      );
      setTotalUnapprovedVendors(unapprovedVendorsSnapshot.size);

      // Fetch total orders
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      setTotalOrders(ordersSnapshot.size);

      // Fetch total users
      const usersSnapshot = await getDocs(collection(db, "users"));
      setTotalUsers(usersSnapshot.size);

      // Fetch total products
      const productsSnapshot = await getDocs(collection(db, "products"));
      setTotalProducts(productsSnapshot.size);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  useEffect(() => {
    // Fetch the counts when the component mounts
    fetchCounts();
  }, []);

  const handleLogoutClick = () => {
    setModalOpen(true); // Open the modal when clicking logout
  };

  const closeModal = () => {
    setModalOpen(false); // Close the modal
  };

  // Navigate to the user page on click
  const handleUserClick = () => {
    navigate("/dashboard/manageusers"); // Change this to the route for your user page
  };
  const handleVendorClick = () => {
    navigate("/dashboard/vendors");
  };
  const handleUnapprovedVendorClick = () => {
    navigate("/dashboard/unapproved-vendors"); // Navigate to the page where you display the unapproved vendors
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-semibold text-gray-700">
          Admin Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {/* Total Vendors */}
        <div
          onClick={handleVendorClick}
          className="bg-white shadow-lg p-6 cursor-pointer rounded-lg"
        >
          <h2 className="text-xl font-semibold text-gray-700">Total Vendors</h2>
          <p className="text-2xl font-bold text-blue-500">{totalVendors}</p>
        </div>

        {/* Total Unapproved Vendors */}
        <div
          onClick={handleUnapprovedVendorClick}
          className="bg-white shadow-lg p-6 cursor-pointer rounded-lg"
        >
          <h2 className="text-xl font-semibold text-gray-700">
            Unapproved Vendors
          </h2>
          <p className="text-2xl font-bold text-orange-500">
            {totalUnapprovedVendors}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700">Total Orders</h2>
          <p className="text-2xl font-bold text-green-500">{totalOrders}</p>
        </div>

        {/* Total Users */}
        <div
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
          onClick={handleUserClick} // Navigate to users page on click
        >
          <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
          <p className="text-2xl font-bold text-yellow-500">{totalUsers}</p>
        </div>

        {/* Total Products */}
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700">
            Total Products
          </h2>
          <p className="text-2xl font-bold text-red-500">{totalProducts}</p>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-6">
        <button
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          onClick={handleLogoutClick}
        >
          Log Out
        </button>
      </div>

      {/* Render the Logout Modal */}
      <LogoutModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
};

export default AdminDashboard;
