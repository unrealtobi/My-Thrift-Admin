import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { RotatingLines } from "react-loader-spinner";
import { getFunctions, httpsCallable } from "firebase/functions";
import Modal from "../../Components/Modal";
import ReactPaginate from "react-paginate";
import { FaChevronLeft } from "react-icons/fa";
import Papa from "papaparse";


const functions = getFunctions();
const deleteUserAndData = httpsCallable(functions, "deleteUserAndData");

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [loading, setLoading] = useState(true);

  const USERS_PER_PAGE = 10;
  const [page, setPage] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data(), __createTime: doc.createTime?.toMillis?.() }))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || b.__createTime || 0) -
            (a.createdAt?.toMillis?.() || a.__createTime || 0)
        );

      setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = [...users];
    if (search) {
      result = result.filter(
        (user) =>
          user.username?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      result = result.filter((user) => {
        if (filterStatus === "active") return user.isActive !== false;
        if (filterStatus === "inactive") return user.isActive === false;
        return true;
      });
    }
    setFilteredUsers(result);
  }, [users, search, filterStatus]);

  const paginatedUsers = filteredUsers.slice(
    page * USERS_PER_PAGE,
    (page + 1) * USERS_PER_PAGE
  );

  const handleSelect = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (paginatedUsers.every((user) => selectedUserIds.includes(user.id))) {
      setSelectedUserIds([]);
    } else {
      const currentPageIds = paginatedUsers.map((user) => user.id);
      setSelectedUserIds(currentPageIds);
    }
  };

  const handleDeleteUsers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("No users selected for deletion.");
      return;
    }

    try {
      setDeleteLoading(true);
      const deletePromises = selectedUserIds.map(async (userId) => {
        const response = await fetch(
          "https://us-central1-ecommerce-ba520.cloudfunctions.net/deleteUserAndData",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uid: userId }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete user: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.error);
      });

      await Promise.all(deletePromises);
      toast.success("Selected users deleted successfully.");
      setUsers(users.filter((u) => !selectedUserIds.includes(u.id)));
      setSelectedUserIds([]);
    } catch (error) {
      toast.error(`Error deleting users: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleActivate = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("No users selected for activation.");
      return;
    }

    try {
      await Promise.all(
        selectedUserIds.map(async (userId) => {
          await updateDoc(doc(db, "users", userId), { isActive: true });
        })
      );
      toast.success("Users activated successfully.");
      setUsers((prev) =>
        prev.map((u) =>
          selectedUserIds.includes(u.id) ? { ...u, isActive: true } : u
        )
      );
      setSelectedUserIds([]);
    } catch (err) {
      toast.error("Activation failed.");
    }
  };

  const handleDeactivate = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("No users selected for deactivation.");
      return;
    }

    try {
      await Promise.all(
        selectedUserIds.map(async (userId) => {
          await updateDoc(doc(db, "users", userId), { isActive: false });
        })
      );
      toast.success("Users deactivated successfully.");
      setUsers((prev) =>
        prev.map((u) =>
          selectedUserIds.includes(u.id) ? { ...u, isActive: false } : u
        )
      );
      setSelectedUserIds([]);
    } catch (err) {
      toast.error("Deactivation failed.");
    }
  };
  const handleExportUsersCSV = async () => {
  try {
    toast.loading("Exporting users...");

    const usersSnapshot = await getDocs(collection(db, "users"));
    const usersList = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const enhancedUsers = await Promise.all(
      usersList.map(async (user) => {
        const username = user.username || "";
        const email = user.email || "";
        const phone = `="${user.phoneNumber || ""}"`;
        const status = user.isDeactivated ? "Inactive" : "Active";

        let cartCount = 0;
        let productLinks = [];

        try {
          const cartDoc = await getDoc(doc(db, "carts", user.id));
          const cartData = cartDoc.exists() ? cartDoc.data().cart : null;

          if (cartData && typeof cartData === "object") {
            for (const cartEntry of Object.values(cartData)) {
              if (cartEntry.products && typeof cartEntry.products === "object") {
                const productIds = Object.keys(cartEntry.products);
                cartCount += productIds.length;

                // Create links using your routing pattern
                // const links = productIds.map(
                //   (id) => `https://shopmythrift.store/dashboard/products/${id}`
                // );
                // productLinks.push(...links);
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch cart for user ${user.id}:`, err);
        }

        return {
          "User ID": user.id,
          Username: username,
          Email: email,
          Phone: phone,
          Status: status,
          "Cart Items": cartCount,
          // "Cart Product Links": productLinks.join(", "),
        };
      })
    );

    enhancedUsers.sort((a, b) => {
      if (a.Status === "Active" && b.Status !== "Active") return -1;
      if (a.Status !== "Active" && b.Status === "Active") return 1;
      return 0;
    });

    const csv = Papa.unparse(enhancedUsers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users_list.csv");
    link.click();

    toast.dismiss();
    toast.success("Users exported successfully.");
  } catch (err) {
    toast.dismiss();
    console.error("Error exporting users:", err);
    toast.error("Error exporting users.");
  }
};



  const confirmAction = (action) => {
    if (selectedUserIds.length === 0) {
      toast.error("No users selected.");
      return;
    }
    setModalAction(action);
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    if (modalAction === "delete") handleDeleteUsers();
    else if (modalAction === "activate") handleActivate();
    else if (modalAction === "deactivate") handleDeactivate();
    setShowModal(false);
  };

  const getModalContent = () => {
    if (modalAction === "delete")
      return {
        title: "Confirm Deletion",
        message:
          "Are you sure you want to delete the selected users and their data?",
      };
    if (modalAction === "activate")
      return {
        title: "Confirm Activation",
        message: "Are you sure you want to activate the selected users?",
      };
    if (modalAction === "deactivate")
      return {
        title: "Confirm Deactivation",
        message: "Are you sure you want to deactivate the selected users?",
      };
    return {};
  };

  const totalUsers = users.length;
  const activatedCount = users.filter((u) => u.isActive !== false).length;
  const deactivatedCount = users.filter((u) => u.isActive === false).length;

  const handleView = async (user) => {
    if (user.isActive === undefined) {
      await updateDoc(doc(db, "users", user.id), { isActive: true });
    }
    navigate(`/dashboard/newusers/${user.id}`);
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-4"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <div className="flex justify-center mb-8">
        <div className="bg-customOrange p-4 w-64 rounded-lg text-center">
          <p className="text-white text-lg font-bold">
            Total Users: {totalUsers}
          </p>
          <p className="text-white text-md">Activated: {activatedCount}</p>
          <p className="text-white text-md">Deactivated: {deactivatedCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          className="p-2 border rounded w-full md:w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-2 border rounded w-full md:w-1/4"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Activated</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <RotatingLines width="40" strokeColor="orange" />
        </div>
      ) : (
        <>
          <table className="min-w-full bg-white border rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={
                      paginatedUsers.length > 0 &&
                      paginatedUsers.every((user) =>
                        selectedUserIds.includes(user.id)
                      )
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left">Username</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleSelect(user.id)}
                    />
                  </td>
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-sm rounded-full font-medium ${
                        user.isActive === false
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleView(user)}
                      className="text-blue-600 hover:underline"
                    >
                      View & Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => confirmAction("activate")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Activate Selected
            </button>
            <button
              onClick={() => confirmAction("deactivate")}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Deactivate Selected
            </button>
            <button
              onClick={() => confirmAction("delete")}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button
  onClick={handleExportUsersCSV}
  className="bg-blue-700 text-white px-4 py-2 rounded"
>
  Export Users CSV
</button>
          </div>

          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            pageCount={Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
            onPageChange={({ selected }) => setPage(selected)}
            containerClassName="flex justify-center mt-6 space-x-2"
            pageClassName="px-3 py-2 bg-gray-200 rounded"
            activeClassName="bg-blue-500 text-white"
            previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
            nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
          />
        </>
      )}

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleModalConfirm}
        title={getModalContent().title}
        message={getModalContent().message}
      />
    </div>
  );
}
