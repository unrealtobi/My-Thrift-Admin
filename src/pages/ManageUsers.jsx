import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  query,
  updateDoc,
  doc,
  deleteDoc, // For deleting documents
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase Functions for Cloud Functions
import { deleteUser } from "firebase/auth"; // For deleting users from Firebase Authentication
import { db } from "../firebase.config";
import { auth } from "../firebase.config"; // Import Firebase auth for user deletion
import toast from "react-hot-toast";
import ReactPaginate from "react-paginate";
import { RotatingLines } from "react-loader-spinner";
import { FaChevronLeft, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Import useNavigate
// Initialize Firebase Functions
const functions = getFunctions();
const deleteUserAndData = httpsCallable(functions, "deleteUserAndData");

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // For viewing/editing user
  const [isEditing, setIsEditing] = useState(false); // Toggle between view/edit mode
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({}); // Track loading for individual buttons
  const [deleteLoading, setDeleteLoading] = useState(false); // Track loading for delete button
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [totalUsers, setTotalUsers] = useState(0); // Total user count
  const [activatedCount, setActivatedCount] = useState(0); // Count of activated accounts
  const [deactivatedCount, setDeactivatedCount] = useState(0); // Count of deactivated accounts
  const [selectedUserIds, setSelectedUserIds] = useState([]); // Track selected user IDs for deletion

  const USERS_PER_PAGE = 15;
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [currentItems, setCurrentItems] = useState([]); // Current users to display
  const [itemOffset, setItemOffset] = useState(0); // Offset for the current page
  const navigate = useNavigate();
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);

      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id, // Ensure the user ID is included
        ...doc.data(),
      }));

      // Count activated and deactivated accounts
      const activated = usersList.filter((user) => !user.isDeactivated).length;
      const deactivated = usersList.filter((user) => user.isDeactivated).length;

      // Set users, count, and pagination
      setUsers(usersList);
      setTotalUsers(usersList.length); // Set total user count
      setActivatedCount(activated);
      setDeactivatedCount(deactivated);
      setPageCount(Math.ceil(usersList.length / USERS_PER_PAGE));
    } catch (error) {
      toast.error("Error fetching users: " + error.message);
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const endOffset = itemOffset + USERS_PER_PAGE;
    const filteredUsers = users.filter((user) =>
      searchTerm === "" // If no search term, return all users
        ? true
        : (user.displayName &&
            user.displayName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (user.username &&
            user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email &&
            user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    console.log("Total users:", users.length);
    console.log("Filtered users:", filteredUsers.length);
    console.log("Displaying from", itemOffset, "to", endOffset);

    setCurrentItems(filteredUsers.slice(itemOffset, endOffset));
  }, [itemOffset, users, searchTerm]);

  // Handle page click for pagination
  const handlePageClick = (event) => {
    const newOffset = (event.selected * USERS_PER_PAGE) % users.length;
    setItemOffset(newOffset);
  };

  // Handle checkbox select
  const handleCheckboxChange = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Bulk Deactivation
  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("No users selected for deactivation.");
      return;
    }

    try {
      setLoading(true);
      console.log("Deactivating users:", selectedUserIds);
      for (const userId of selectedUserIds) {
        // Update Firestore to deactivate users
        await updateDoc(doc(db, "users", userId), { isDeactivated: true });
      }
      toast.success("Selected users deactivated successfully.");
      fetchUsers(); // Refresh user list after deactivation
      setSelectedUserIds([]); // Clear selected user IDs
    } catch (error) {
      console.error("Error deactivating users:", error);
      toast.error("Error deactivating selected users.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Deletion using Cloud Function
  const handleDeleteUsers = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("No users selected for deletion.");
      return;
    }

    try {
      setDeleteLoading(true);
      console.log("Deleting users:", selectedUserIds);

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
          throw new Error(
            `Failed to delete user. Server responded with status ${response.status}`
          );
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }
      });

      await Promise.all(deletePromises);

      toast.success("Selected users and their data deleted successfully.");

      // Clear selected users and fetch the updated list
      setSelectedUserIds([]);
      fetchUsers(); // Ensure the list is updated
    } catch (error) {
      console.error("Error deleting users:", error);
      toast.error(`Error deleting users: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle deactivating or reactivating user
  const handleToggleActive = async (user) => {
    setButtonLoading((prevState) => ({ ...prevState, [user.id]: true })); // Set loading for specific button
    try {
      const userDoc = doc(db, "users", user.id);
      await updateDoc(userDoc, { isDeactivated: !user.isDeactivated });
      toast.success(
        `User ${user.isDeactivated ? "reactivated" : "deactivated"}.`
      );

      // Update the user list in real time
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, isDeactivated: !u.isDeactivated } : u
        )
      );
    } catch (error) {
      toast.error("Error updating user status.");
      console.error("Error updating user status:", error);
    } finally {
      setButtonLoading((prevState) => ({ ...prevState, [user.id]: false })); // Turn off loading for specific button
    }
  };

  // Handle single user deletion in detail view
  const handleDeleteSingleUser = async (userId) => {
    try {
      setDeleteLoading(true);
      console.log("Deleting user:", userId);

      // Prepare the request payload
      const response = await fetch(
        "https://us-central1-ecommerce-ba520.cloudfunctions.net/deleteUserAndData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid: userId }), // Send uid in the body
        }
      );

      // Check if the response is OK
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("User and their data deleted successfully.");
          fetchUsers(); // Refresh user list after deletion
          setSelectedUser(null); // Clear selected user details
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
    }
  };

  // Handle saving changes to user profile
  const handleSaveChanges = async () => {
    if (selectedUser) {
      try {
        const userDoc = doc(db, "users", selectedUser.id);
        await updateDoc(userDoc, {
          displayName: selectedUser.displayName || "",
          email: selectedUser.email || "",
          phoneNumber: selectedUser.phoneNumber || "",
          birthday: selectedUser.birthday || "",
        });
        setIsEditing(false);
        toast.success("User details updated successfully.");
        fetchUsers(); // Refresh user list after save
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("Error updating user details.");
      }
    }
  };
  const handleBackClick = () => {
    navigate('/dashboard'); // Navigate to the previous page
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackClick} // Set onClick to navigate back
          className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaChevronLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-3xl text-customOrange font-bold font-opensans">
          Manage Users
        </h1>
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search users..."
            className="p-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-customOrange p-4 w-64 rounded-lg text-center">
          <p className="text-white text-lg font-bold">
            Total Users: {totalUsers}
          </p>
          <p className="text-white text-md">Activated: {activatedCount}</p>
          <p className="text-white text-md">Deactivated: {deactivatedCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <RotatingLines strokeColor="purple" width="50" visible={true} />
        </div>
      ) : (
        <>
          <button
            className="bg-yellow-500 text-white mr-4 px-4 py-2 rounded-lg mb-4"
            onClick={handleBulkDeactivate}
            disabled={selectedUserIds.length === 0}
          >
            {loading ? (
              <RotatingLines strokeColor="white" width="20" visible={true} />
            ) : (
              "Deactivate Selected"
            )}
          </button>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg mb-4"
            onClick={handleDeleteUsers}
            disabled={selectedUserIds.length === 0}
          >
            {deleteLoading ? (
              <RotatingLines strokeColor="white" width="20" visible={true} />
            ) : (
              "Delete Selected"
            )}
          </button>

          {/* List of users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <ul className="bg-white shadow-lg rounded-lg p-4">
                {currentItems.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  currentItems.map((user) => (
                    <li
                      key={user.id}
                      className="p-4 border-b cursor-pointer flex justify-between items-center hover:bg-gray-100"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditing(false); // View mode by default
                      }}
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleCheckboxChange(user.id)}
                      />
                      <div>
                        <span className="font-poppins text-sm font-semibold uppercase">
                          {user.displayName
                            ? user.displayName.toUpperCase()
                            : user.username.toUpperCase()}
                        </span>

                        <span className="font-poppins text-xs ml-3 text-gray-500">
                          (
                          {user.email
                            ? user.email.toLowerCase()
                            : "unknown email"}
                          )
                        </span>
                      </div>

                      <span
                        className={`${
                          user.isDeactivated ? "bg-red-500" : "bg-green-500"
                        } text-white px-2 py-1 rounded-full text-xs font-poppins`}
                      >
                        {user.isDeactivated ? "Deactivated" : "Active"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* View/Edit user details */}
            {selectedUser && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-ubuntu text-customOrange mb-4">
                  {isEditing ? "Edit User" : "View User"}
                </h2>
                <div className="flex justify-center mb-6">
                  {selectedUser.photoURL ? (
                    <img
                      src={selectedUser.photoURL}
                      alt={selectedUser.displayName}
                      className="w-24 h-24 rounded-full shadow-lg"
                    />
                  ) : (
                    <FaUserCircle className="text-gray-400 w-24 h-24 rounded-full shadow-lg" />
                  )}
                </div>

                {/* Display Name Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Name:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedUser.displayName}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          displayName: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedUser.displayName || "No name set"}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Email:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedUser.email}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          email: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedUser.email || "No email set"}
                    </p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Phone Number:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedUser.phoneNumber}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-2/3 font-poppins bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedUser.phoneNumber || "No phone number set"}
                    </p>
                  )}
                </div>

                {/* Birthday Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Birthday:</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={selectedUser.birthday}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          birthday: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedUser.birthday || "No birthday set"}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Role:</label>
                  <p className="w-2/3 text-red-600 font-poppins font-bold">
                    {selectedUser.role}
                  </p>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-between">
                  {isEditing ? (
                    <button
                      onClick={handleSaveChanges}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      Save Changes
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
                    onClick={() => handleToggleActive(selectedUser)}
                    className={`ml-4 px-4 py-2 rounded-lg ${
                      selectedUser.isDeactivated
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                    disabled={buttonLoading[selectedUser.id]} // Disable button during loading
                  >
                    {buttonLoading[selectedUser.id] ? (
                      <RotatingLines
                        strokeColor="white"
                        width="20"
                        visible={true}
                      />
                    ) : selectedUser.isDeactivated ? (
                      "Reactivate"
                    ) : (
                      "Deactivate"
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSingleUser(selectedUser.id)}
                    className="ml-4 px-4 py-2 rounded-lg bg-red-500 text-white"
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <RotatingLines
                        strokeColor="white"
                        width="20"
                        visible={true}
                      />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={pageCount}
            onPageChange={handlePageClick}
            containerClassName={"flex justify-center mt-6 space-x-2"}
            pageClassName={"px-3 py-2 bg-gray-200 rounded"}
            activeClassName={"bg-blue-500 text-white"}
            previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
            nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
          />
        </>
      )}
    </div>
  );
};

export default ManageUsers;
