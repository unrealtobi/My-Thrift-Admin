import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  query,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions"; // Import Firebase Functions
import { db } from "../firebase.config"; // Firestore database connection
import { toast } from "react-hot-toast";
import ReactPaginate from "react-paginate";
import { RotatingLines } from "react-loader-spinner";
import { FaChevronLeft, FaUserCircle } from "react-icons/fa";
import {
  FaStoreAlt,
  FaMapMarkedAlt,
  FaInfoCircle,
  FaBuilding,
  FaStar,
  FaUsers,
  FaBox,
  FaCheckCircle,
  FaTimesCircle,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";

// Initialize Firebase Functions
const functions = getFunctions();
const deleteVendorAndData = httpsCallable(functions, "deleteVendorAndData");

const ManageVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalVendors, setTotalVendors] = useState(0);
  const [activatedCount, setActivatedCount] = useState(0);
  const [deactivatedCount, setDeactivatedCount] = useState(0);
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const VENDORS_PER_PAGE = 15;
  const [pageCount, setPageCount] = useState(0);
  const [currentItems, setCurrentItems] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const navigate = useNavigate();

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const vendorsQuery = query(collection(db, "vendors"));
      const vendorsSnapshot = await getDocs(vendorsQuery);

      const vendorsList = vendorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const activated = vendorsList.filter(
        (vendor) => !vendor.isDeactivated
      ).length;
      const deactivated = vendorsList.filter(
        (vendor) => vendor.isDeactivated
      ).length;

      setVendors(vendorsList);
      setTotalVendors(vendorsList.length);
      setActivatedCount(activated);
      setDeactivatedCount(deactivated);
      setPageCount(Math.ceil(vendorsList.length / VENDORS_PER_PAGE));
    } catch (error) {
      toast.error("Error fetching vendors: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const endOffset = itemOffset + VENDORS_PER_PAGE;
    const filteredVendors = vendors.filter((vendor) =>
      searchTerm === ""
        ? true
        : (vendor.shopName &&
            vendor.shopName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vendor.email &&
            vendor.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setCurrentItems(filteredVendors.slice(itemOffset, endOffset));
  }, [itemOffset, vendors, searchTerm]);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * VENDORS_PER_PAGE) % vendors.length;
    setItemOffset(newOffset);
  };

  const handleCheckboxChange = (vendorId) => {
    if (selectedVendorIds.includes(vendorId)) {
      setSelectedVendorIds(selectedVendorIds.filter((id) => id !== vendorId));
    } else {
      setSelectedVendorIds([...selectedVendorIds, vendorId]);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedVendorIds.length === 0) {
      toast.error("No vendors selected for deactivation.");
      return;
    }

    try {
      setLoading(true);
      for (const vendorId of selectedVendorIds) {
        await updateDoc(doc(db, "vendors", vendorId), { isDeactivated: true });
      }
      toast.success("Selected vendors deactivated successfully.");
      fetchVendors();
      setSelectedVendorIds([]);
    } catch (error) {
      toast.error("Error deactivating selected vendors.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteVendors = async () => {
    if (selectedVendorIds.length === 0) {
      toast.error("No vendors selected for deletion.");
      return;
    }

    try {
      setDeleteLoading(true);
      const deletePromises = selectedVendorIds.map(async (vendorId) => {
        const response = await fetch(
          "https://us-central1-ecommerce-ba520.cloudfunctions.net/deleteVendorAndData",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uid: vendorId }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete vendor. Server responded with status ${response.status}`
          );
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }
      });

      await Promise.all(deletePromises);

      toast.success("Selected vendors and their data deleted successfully.");
      setSelectedVendorIds([]);
      fetchVendors();
    } catch (error) {
      toast.error(`Error deleting vendors: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteSingleVendor = async (vendorId) => {
    try {
      setDeleteLoading(true);
      const response = await deleteVendorAndData({ uid: vendorId });
      if (response.data.success) {
        toast.success("Vendor and associated data deleted successfully.");
        fetchVendors();
      } else {
        throw new Error(response.data.error || "Deletion failed");
      }
    } catch (error) {
      toast.error(`Error deleting vendor: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (vendor) => {
    setButtonLoading((prevState) => ({ ...prevState, [vendor.id]: true }));
    try {
      const vendorDoc = doc(db, "vendors", vendor.id);
      await updateDoc(vendorDoc, { isDeactivated: !vendor.isDeactivated });
      toast.success(
        `Vendor ${vendor.isDeactivated ? "reactivated" : "deactivated"}.`
      );
      setVendors((prevVendors) =>
        prevVendors.map((v) =>
          v.id === vendor.id ? { ...v, isDeactivated: !v.isDeactivated } : v
        )
      );
    } catch (error) {
      toast.error("Error updating vendor status.");
    } finally {
      setButtonLoading((prevState) => ({ ...prevState, [vendor.id]: false }));
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedVendor) {
      toast.error("No vendor selected.");
      return;
    }

    try {
      const vendorDoc = doc(db, "vendors", selectedVendor.id);
      await updateDoc(vendorDoc, {
        shopName: selectedVendor.shopName || "",
        email: selectedVendor.email || "",
        phoneNumber: selectedVendor.phoneNumber || "",
        marketPlace: selectedVendor.marketPlace || "",
        marketPlaceType: selectedVendor.marketPlaceType || "",
        description: selectedVendor.description || "",
        complexName: selectedVendor.complexName || "",
      });

      setIsEditing(false);
      toast.success("Vendor details updated successfully.");
      fetchVendors();
    } catch (error) {
      toast.error("Error updating vendor details.");
    }
  };

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackClick}
          className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaChevronLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-3xl text-customOrange font-bold font-opensans">
          Manage Vendors
        </h1>
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search vendors..."
            className="p-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-customOrange p-4 w-64 rounded-lg text-center">
          <p className="text-white text-lg font-bold">
            Total Vendors: {totalVendors}
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
            disabled={selectedVendorIds.length === 0}
          >
            {loading ? (
              <RotatingLines strokeColor="white" width="20" visible={true} />
            ) : (
              "Deactivate Selected"
            )}
          </button>

          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg mb-4"
            onClick={handleDeleteVendors}
            disabled={selectedVendorIds.length === 0}
          >
            {deleteLoading ? (
              <RotatingLines strokeColor="white" width="20" visible={true} />
            ) : (
              "Delete Selected"
            )}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <ul className="bg-white shadow-lg rounded-lg p-4">
                {currentItems.length === 0 ? (
                  <p>No vendors found.</p>
                ) : (
                  currentItems.map((vendor) => (
                    <li
                      key={vendor.id}
                      className="p-4 border-b cursor-pointer flex justify-between items-center hover:bg-gray-100"
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setIsEditing(false);
                      }}
                    >
                      <div>
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedVendorIds.includes(vendor.id)}
                          onChange={() => handleCheckboxChange(vendor.id)}
                        />
                        <span className="font-poppins text-sm font-semibold uppercase">
                          {vendor.shopName
                            ? vendor.shopName.toUpperCase()
                            : vendor.firstName
                            ? vendor.firstName.toUpperCase()
                            : "No Name Available"}
                        </span>
                        <span className="font-poppins text-xs ml-3 text-gray-500">
                          (
                          {vendor.email
                            ? vendor.email.toLowerCase()
                            : "unknown email"}
                          )
                        </span>
                      </div>
                      <span
                        className={`${
                          vendor.isDeactivated ? "bg-red-500" : "bg-green-500"
                        } text-white px-2 py-1 rounded-full text-xs font-poppins`}
                      >
                        {vendor.isDeactivated ? "Deactivated" : "Active"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* View/Edit vendor details */}
            {selectedVendor && (
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-ubuntu text-customOrange mb-4">
                  {isEditing ? "Edit Vendor" : "View Vendor"}
                </h2>
                <div className="flex justify-center mb-6">
                  {selectedVendor.photoURL ? (
                    <img
                      src={selectedVendor.photoURL}
                      alt={selectedVendor.shopName}
                      className="w-24 h-24 rounded-full shadow-lg"
                    />
                  ) : (
                    <FaUserCircle className="text-gray-400 w-24 h-24 rounded-full shadow-lg" />
                  )}
                </div>

                {/* Shop Name Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Shop Name:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedVendor.shopName}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          shopName: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.shopName || "No shop name set"}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Email:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedVendor.email}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          email: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.email || "No email set"}
                    </p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Phone Number:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedVendor.phoneNumber}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-2/3 font-poppins bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.phoneNumber || "No phone number set"}
                    </p>
                  )}
                </div>
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaStoreAlt className="mr-2" />
                    Market Place:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedVendor.marketPlace}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          marketPlace: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.marketPlace || "Not Set"}
                    </p>
                  )}
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaMapMarkedAlt className="mr-2" />
                    Market Place Type:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedVendor.marketPlaceType}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          marketPlaceType: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.marketPlaceType || "Not Set"}
                    </p>
                  )}
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    Description:
                  </label>
                  {isEditing ? (
                    <textarea
                      value={selectedVendor.description}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          description: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.description || "No Description"}
                    </p>
                  )}
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaBuilding className="mr-2" />
                    Complex Name:
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedVendor.complexName}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          complexName: e.target.value,
                        })
                      }
                      className="w-2/3 bg-transparent border-none outline-none"
                    />
                  ) : (
                    <p className="w-2/3 font-poppins">
                      {selectedVendor.complexName || "Not Set"}
                    </p>
                  )}
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaStar className="mr-2" />
                    Rating:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {selectedVendor.rating || "Not Rated"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaUsers className="mr-2" />
                    Rating Count:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {selectedVendor.ratingCount || "No Ratings"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaBox className="mr-2" />
                    Products:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {selectedVendor.productIds?.join(", ") || "No Products"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    {selectedVendor.profileComplete ? (
                      <FaCheckCircle className="mr-2 text-green-500" />
                    ) : (
                      <FaTimesCircle className="mr-2 text-red-500" />
                    )}
                    Profile Complete:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {selectedVendor.profileComplete ? "Yes" : "No"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    Created Since:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {selectedVendor.createdSince
                      ? selectedVendor.createdSince.toDate().toLocaleString()
                      : "Unknown"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaClock className="mr-2" />
                    Last Updated:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {selectedVendor.lastUpdate
                      ? selectedVendor.lastUpdate.toDate().toLocaleString()
                      : "Not Updated"}
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
                    onClick={() => handleToggleActive(selectedVendor)}
                    className={`ml-4 px-4 py-2 rounded-lg ${
                      selectedVendor.isDeactivated
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                    disabled={buttonLoading[selectedVendor.id]}
                  >
                    {buttonLoading[selectedVendor.id] ? (
                      <RotatingLines
                        strokeColor="white"
                        width="20"
                        visible={true}
                      />
                    ) : selectedVendor.isDeactivated ? (
                      "Reactivate"
                    ) : (
                      "Deactivate"
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSingleVendor(selectedVendor.id)}
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

export default ManageVendors;
