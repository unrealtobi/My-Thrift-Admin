// src/components/PushNotifs.jsx
import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

// Simple rotating-lines spinner using Tailwind
const Spinner = () => (
  <div className="w-10 h-10 border-4 border-customOrange border-t-transparent rounded-full animate-spin mx-auto my-4" />
);

export default function PushNotifs() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("allVendors");
  const [vendorIds, setVendorIds] = useState("");
  const [userIds, setUserIds] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const functions = getFunctions();
  const sendPush = httpsCallable(functions, "sendAdminPushNotification");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.loading("Sending broadcast...");
    try {
      const payload = {
        title,
        body,
        targetType,
        vendorIds: vendorIds
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        userIds: userIds
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };
      const { data } = await sendPush(payload);
      if (data.success) {
        toast.dismiss();
        toast.success(`Sent ${data.sent}/${data.attempted} notifications`);
      } else {
        toast.dismiss();
        toast.error(data.message);
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-white bg-customOrange px-4 py-2 rounded-lg mb-6"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-customOrange mb-4">
          Broadcast Push Notification
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Title
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-customOrange"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Body</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-customOrange"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Target
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-customOrange"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
            >
              <option value="allVendors">All Vendors</option>
              <option value="allUsers">All Users</option>
              <option value="custom">Custom IDs</option>
            </select>
          </div>

          {targetType === "custom" && (
            <>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Vendor IDs
                </label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-customOrange"
                  placeholder="e.g. vend1, vend2"
                  value={vendorIds}
                  onChange={(e) => setVendorIds(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  User IDs
                </label>
                <input
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-customOrange"
                  placeholder="e.g. userA, userB"
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="pt-4">
            {loading ? (
              <Spinner />
            ) : (
              <button
                type="submit"
                className="w-full bg-customOrange text-white py-2 rounded hover:bg-opacity-90 transition"
              >
                Send Push
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
