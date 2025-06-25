// File: src/pages/admin/stockpiles/[id].jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase.config";
import { FaChevronLeft } from "react-icons/fa";

export default function StockpileDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [stockpile, setStockpile] = useState(null);
  const [vendorName, setVendorName] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const spRef = doc(db, "stockpiles", id);
        const spSnap = await getDoc(spRef);
        if (spSnap.exists()) {
          const spData = { id: spSnap.id, ...spSnap.data() };
          setStockpile(spData);

          // Fetch vendor name
          if (spData.vendorId) {
            const vendorSnap = await getDoc(
              doc(db, "vendors", spData.vendorId)
            );
            if (vendorSnap.exists()) {
              setVendorName(vendorSnap.data().shopName || "Unnamed Vendor");
            }
          }

          // Fetch user name
          if (spData.userId) {
            const userSnap = await getDoc(doc(db, "users", spData.userId));
            if (userSnap.exists()) {
              const user = userSnap.data();
              setUserName(user.displayName || user.name || "Unnamed User");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load stockpile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  if (loading || !stockpile) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex mb-8 items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>
      <h1 className="text-2xl font-bold text-customOrange">
        Stockpile Details
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stockpile Info */}
        <div className="bg-white p-4 shadow rounded-lg border border-gray-100">
          <h2 className="text-lg font-semibold text-customOrange text-center mb-3">
            Stockpile Info
          </h2>
          <p>
            <strong>Chosen Weeks:</strong> {stockpile.chosenWeeks}
          </p>
          <p>
            <strong>Max Allowed Weeks:</strong> {stockpile.maxAllowedWeeks}
          </p>
          <p>
            <strong>Start Date:</strong> {formatDate(stockpile.startDate)}
          </p>
          <p>
            <strong>End Date:</strong> {formatDate(stockpile.endDate)}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`px-2 py-1 text-sm rounded-full font-medium ${
                stockpile.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {stockpile.isActive ? "Active" : "Inactive"}
            </span>
          </p>
          <p>
            <strong>Requested For Shipping:</strong>{" "}
            {stockpile.requestedForShipping ? "Yes" : "No"}
          </p>
        </div>

        {/* Linked Info */}
        <div className="bg-white p-4 shadow rounded-lg border border-gray-100">
          <h2 className="text-lg font-semibold text-customOrange mb-3">
            User & Vendor Info
          </h2>
          <p>
            <strong>User:</strong> {userName}
          </p>
          <p>
            <strong>Vendor:</strong>{" "}
            <Link
              to={`/dashboard/vendors/${stockpile.vendorId}`}
              className="text-blue-600 hover:underline"
            >
              {vendorName}
            </Link>
          </p>
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white p-4 shadow rounded-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-customOrange mb-3">Orders</h2>
        {stockpile.orderIds?.length ? (
          <ul className="list-disc pl-6 space-y-1">
            {stockpile.orderIds.map((orderId, i) => (
              <li key={i}>
                <Link
                  to={`/dashboard/orders/${orderId}`}
                  className="text-blue-600 hover:underline"
                >
                  {orderId}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No linked orders.</p>
        )}
      </div>
    </div>
  );
}
