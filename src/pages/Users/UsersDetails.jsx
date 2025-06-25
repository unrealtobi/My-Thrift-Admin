import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import Modal from "../../Components/Modal";
import { toast, ToastContainer } from "react-toastify";
import { RotatingLines } from "react-loader-spinner";
import ReactPaginate from "react-paginate";
import { getFunctions, httpsCallable } from "firebase/functions"; // At top
import { FaChevronLeft } from "react-icons/fa";

const functions = getFunctions();
const deleteUserAndData = httpsCallable(functions, "deleteUserAndData");

export default function UserDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [deleteLoading, setDeleteLoading] = useState(false); // Add this state

  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [stockpiles, setStockpiles] = useState([]);

  const [orderPage, setOrderPage] = useState(0);
  const [inquiryPage, setInquiryPage] = useState(0);
  const [stockpilePage, setStockpilePage] = useState(0);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchUser = async () => {
      const ref = doc(db, "users", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        // Create isActive if not existing
        if (data.isActive === undefined) {
          await updateDoc(ref, { isActive: true });
          data.isActive = true;
        }
        setUser({ id: snap.id, ...data });
      }
      setLoading(false);
    };
    fetchUser();
  }, [id]);

  const fetchSubData = async () => {
    if (!id) return;
    const fetchCollection = async (col, stateSetter) => {
      const q = query(collection(db, col), where("userId", "==", id));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      stateSetter(list);
    };
    fetchCollection("orders", setOrders);
    fetchCollection("inquiries", setInquiries);
    fetchCollection("stockpiles", setStockpiles);
  };

  useEffect(() => {
    fetchSubData();
  }, [id]);

  const handleSave = async () => {
    try {
      const ref = doc(db, "users", user.id);
      await updateDoc(ref, {
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthday: user.birthday,
      });
      toast.success("User info updated");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update user info.");
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      console.log("Deleting user:", user.id);

      const response = await fetch(
        "https://us-central1-ecommerce-ba520.cloudfunctions.net/deleteUserAndData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid: user.id }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("User and their data deleted successfully.");
          navigate("/dashboard/users"); // Redirect
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error(
          "Failed to delete user. Server responded with status " +
            response.status
        );
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user.");
    } finally {
      setDeleteLoading(false);
      setShowModal(false);
    }
  };

  const toggleActive = async () => {
    const ref = doc(db, "users", user.id);
    const updated = !user.isActive;
    await updateDoc(ref, { isActive: updated });
    setUser({ ...user, isActive: updated });
    toast.success(`User ${updated ? "activated" : "deactivated"}`);
  };

  const exportToCSV = (data, name) => {
    const header = Object.keys(data[0] || {});
    const rows = data.map((item) => header.map((key) => item[key]));
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${name}_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (ts) => ts?.toDate?.().toLocaleDateString() || "—";

  const paginate = (data, page) =>
    data.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  if (loading || !user) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-4"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>
      <ToastContainer />
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message="Are you sure you want to delete this user?"
      />

      <h1 className="text-2xl font-bold text-center text-customOrange mb-6">
        User Details
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <div className="mb-6 flex flex-col items-center">
          {user.photoURL ? (
            <img src={user.photoURL} className="w-24 h-24 rounded-full" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-300" />
          )}
        </div>

        {/* Fields */}
        {["displayName", "email", "phoneNumber", "birthday"].map((field) => (
          <div
            key={field}
            className="flex items-center mb-4 border rounded-lg px-4 py-2"
          >
            <label className="font-semibold w-1/3 capitalize">
              {field === "displayName" ? "Name" : field}:
            </label>
            {isEditing ? (
              <input
                type={field === "birthday" ? "date" : "text"}
                value={user[field] || ""}
                onChange={(e) =>
                  setUser((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className="w-2/3 bg-transparent border-none outline-none"
              />
            ) : (
              <p className="w-2/3 text-gray-700">{user[field] || "N/A"}</p>
            )}
          </div>
        ))}

        <div className="flex justify-between mt-6">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
            >
              Edit
            </button>
          )}
          <button
            onClick={toggleActive}
            className={`px-4 py-2 rounded-lg ${
              user.isActive ? "bg-red-500" : "bg-green-600"
            } text-white`}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mt-10 mb-4">
        {["orders", "inquiries", "stockpiles"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 shadow rounded-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
          <button
            onClick={() =>
              exportToCSV(
                { orders, inquiries, stockpiles }[activeTab],
                activeTab
              )
            }
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginate(
              { orders, inquiries, stockpiles }[activeTab],
              {
                orders: orderPage,
                inquiries: inquiryPage,
                stockpiles: stockpilePage,
              }[activeTab]
            ).map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{item.id}</td>
                <td className="p-4">{item.status || "N/A"}</td>
                <td className="p-4">
                  <Link
                    to={`/dashboard/${activeTab}/${item.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ReactPaginate
          previousLabel={"Previous"}
          nextLabel={"Next"}
          breakLabel={"..."}
          pageCount={Math.ceil(
            { orders, inquiries, stockpiles }[activeTab].length / ITEMS_PER_PAGE
          )}
          onPageChange={({ selected }) =>
            ({
              orders: setOrderPage,
              inquiries: setInquiryPage,
              stockpiles: setStockpilePage,
            }[activeTab](selected))
          }
          containerClassName="flex justify-center mt-6 space-x-2"
          pageClassName="px-3 py-2 bg-gray-200 rounded"
          activeClassName="bg-blue-500 text-white"
          previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
          nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
        />
      </div>
    </div>
  );
}
