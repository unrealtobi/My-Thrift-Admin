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
  const [totalInquiries, setTotalInquiries] = useState(0);

  const [totalFCMTokens, setTotalFCMTokens] = useState(0);

  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalStockpiles, setTotalStockpiles] = useState(0);
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);
  const [totalCarts, setTotalCarts] = useState(0);
  const [totalUnapprovedVendors, setTotalUnapprovedVendors] = useState(0);
  const navigate = useNavigate(); // Create navigate hook
  const [installEvent, setInstallEvent] = useState(null); // New state for install prompt
  // ... existing state and functions ...

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

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

      // Fetch total Inquiries
      const inquiriesSnapshot = await getDocs(collection(db, "inquiries"));
      setTotalInquiries(inquiriesSnapshot.size);

      // Fetch total Discounts
      const discountsSnapshot = await getDocs(collection(db, "discounts"));
      setTotalDiscounts(discountsSnapshot.size);

      // Fetch total Subscriptions
      const subscriptionsSnapshot = await getDocs(
        collection(db, "subscriptions")
      );
      setTotalSubscriptions(subscriptionsSnapshot.size);

      // Fetch total Stockpiles
      const stockpilesSnapshot = await getDocs(collection(db, "stockpiles"));
      setTotalStockpiles(stockpilesSnapshot.size);
      const fcmTokensSnapshot = await getDocs(collection(db, "fcmTokens"));
      setTotalFCMTokens(fcmTokensSnapshot.size);

      // Fetch total Feedbacks
      const feedbacksSnapshot = await getDocs(collection(db, "feedbacks"));
      setTotalFeedbacks(feedbacksSnapshot.size);

      const cartsSnapshot = await getDocs(collection(db, "carts"));
      setTotalCarts(cartsSnapshot.size);

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
  const handlePushClick = () => {
    navigate("/dashboard/pushnotifications"); // Change this to the route for your user page
  };
  const handleVendorClick = () => {
    navigate("/dashboard/vendors");
  };
  const handleUnapprovedVendorClick = () => {
    navigate("/dashboard/unapproved-vendors"); // Navigate to the page where you display the unapproved vendors
  };
  const handleProductClick = () => {
    navigate("/dashboard/products"); // Route to your products admin page
  };
  const handleOrderClick = () => {
    navigate("/dashboard/orders"); // Route to your products admin page
  };
  const handleVendorsClick = () => {
    navigate("/dashboard/vendor"); // Route to your products admin page
  };
  const handleInquiryClick = () => {
    navigate("/dashboard/inquiries"); // Route to your products admin page
  };
  const handleDiscountClick = () => {
    navigate("/dashboard/discounts"); // Route to your products admin page
  };
  const handleSubscriptionClick = () => {
    navigate("/dashboard/subscribers"); // Route to your products admin page
  };

  const handleStockpilesClick = () => {
    navigate("/dashboard/stockpiles"); // Route to your products admin page
  };

  const handleFeedbacksClick = () => {
    navigate("/dashboard/feedbacks"); // Route to your products admin page
  };

  const handleNewUsersClick = () => {
    navigate("/dashboard/newusers"); // Route to your products admin page
  };

  const handleCartsClick = () => {
    navigate("/dashboard/carts"); // Route to your carts admin page
  };
  const handleRevenueClick = () => {
    navigate("/dashboard/revenue"); // Route to your products admin page
  };

  return (
    <div className="min-h-screen bg-gray-100">
<div className="bg-white shadow p-6 rounded-lg mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-700">Admin Dashboard</h1>
        {installEvent && (
          <button
            onClick={async () => {
              installEvent.prompt();
              const { outcome } = await installEvent.userChoice;
              if (outcome === "accepted") {
                setInstallEvent(null); // Hide button after install
              }
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Install App
          </button>
        )}
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

        <div
          onClick={handleVendorsClick}
          className="bg-white shadow-lg p-6 cursor-pointer rounded-lg"
        >
          <h2 className="text-xl font-semibold text-gray-700">Vendors</h2>
          <p className="text-2xl font-bold text-blue-500">{totalVendors}</p>
        </div>

        {/* Total Orders */}
        <div
          onClick={handleOrderClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
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
        <div
          onClick={handleProductClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">
            Total Products
          </h2>
          <p className="text-2xl font-bold text-red-500">{totalProducts}</p>
        </div>

        {/* Total Inquiries */}

        <div
          onClick={handleInquiryClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Inquiries</h2>
          <p className="text-2xl font-bold text-green-500">{totalInquiries}</p>
        </div>

        {/* Total Discount */}

        <div
          onClick={handleDiscountClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Discounts</h2>
          <p className="text-2xl font-bold text-green-500">{totalDiscounts}</p>
        </div>

        {/* Total Subscribers */}

        <div
          onClick={handleSubscriptionClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Subscribers</h2>
          <p className="text-2xl font-bold text-green-500">
            {" "}
            Primary: {totalSubscriptions}
          </p>
        </div>

        {/* Total Subscribers */}

        <div
          onClick={handleRevenueClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Total Revenue</h2>
          {/* <p className="text-2xl font-bold text-green-500">
            {" "}
            Primary: {totalSubscriptions}
          </p> */}
        </div>
        <div
          onClick={handlePushClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">
            Send Push Notifs
          </h2>
          <p className="text-2xl font-bold text-green-500">
            {totalFCMTokens} tokens
          </p>
        </div>
        {/* Total Stockpile */}

        <div
          onClick={handleStockpilesClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Stockpiles</h2>
          <p className="text-2xl font-bold text-green-500">{totalStockpiles}</p>
        </div>

        {/* Total Feedback */}

        <div
          onClick={handleFeedbacksClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Feedbacks</h2>
          <p className="text-2xl font-bold text-green-500">{totalFeedbacks}</p>
        </div>

        {/* New Users */}

        <div
          onClick={handleNewUsersClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Users</h2>
          <p className="text-2xl font-bold text-green-500">{totalUsers}</p>
        </div>

        {/* New Cart */}

        <div
          onClick={handleCartsClick}
          className="bg-white shadow-lg p-6 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <h2 className="text-xl font-semibold text-gray-700">Carts</h2>
          <p className="text-2xl font-bold text-green-500">{totalCarts}</p>
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
