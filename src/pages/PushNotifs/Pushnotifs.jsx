import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";

// Spinner loader
const Spinner = () => (
  <div className="w-10 h-10 border-4 border-customOrange border-t-transparent rounded-full animate-spin mx-auto my-4" />
);

export default function PushNotifs() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("allVendors");
  const [loading, setLoading] = useState(false);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const navigate = useNavigate();
  const functions = getFunctions();
  const sendPush = httpsCallable(functions, "sendAdminPushNotification");

  // Fetch vendors from Firestore
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const snapshot = await getDocs(collection(db, "vendors"));
        const options = snapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().shopName || doc.data().email || "Unnamed Vendor",
        }));
        setVendorOptions(options);
      } catch (err) {
        toast.error("Failed to load vendors");
      }
    };

    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const options = snapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().username || doc.data().email || "Unnamed User",
        }));
        setUserOptions(options);
      } catch (err) {
        toast.error("Failed to load users");
      }
    };

    fetchVendors();
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.loading("Sending broadcast...");

    try {
      const payload = {
        title,
        body,
        targetType,
        vendorIds: selectedVendors.map((v) => v.value),
        userIds: selectedUsers.map((u) => u.value),
      };

      const { data } = await sendPush(payload);
      toast.dismiss();
      if (data.success) {
        toast.success(`Sent ${data.sent}/${data.attempted} notifications`);
        setTitle("");
        setBody("");
        setSelectedVendors([]);
        setSelectedUsers([]);
      } else {
        toast.error(data.message || "Push failed");
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || "Push failed");
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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-customOrange outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Body</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 h-24 resize-none focus:ring-2 focus:ring-customOrange outline-none"
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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-customOrange outline-none"
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
                  Select Vendors
                </label>
                <Select
                  options={vendorOptions}
                  value={selectedVendors}
                  onChange={setSelectedVendors}
                  isMulti
                  placeholder="Search vendors..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Select Users
                </label>
                <Select
                  options={userOptions}
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                  isMulti
                  placeholder="Search users..."
                  className="react-select-container"
                  classNamePrefix="react-select"
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
