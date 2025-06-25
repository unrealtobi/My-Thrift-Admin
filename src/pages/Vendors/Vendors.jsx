import React, { useEffect, useState } from "react";
import { db } from "../../firebase.config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import ReactPaginate from "react-paginate";
import { RotatingLines } from "react-loader-spinner";
import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import Modal from "../../Components/Modal";

export default function VendorList() {
  const functions = getFunctions();
  const deleteVendorAndData = httpsCallable(functions, "deleteVendorAndData");

  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const VENDORS_PER_PAGE = 10;
  const [itemOffset, setItemOffset] = useState(0);
  const [currentItems, setCurrentItems] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, deactivated
  const [approvalFilter, setApprovalFilter] = useState("all"); // all, approved, unapproved
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [totalVendors, setTotalVendors] = useState(0);
  const [activatedCount, setActivatedCount] = useState(0);
  const [deactivatedCount, setDeactivatedCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [unapprovedCount, setUnapprovedCount] = useState(0);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "vendors"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setVendors(list);

      setTotalVendors(list.length);
      setActivatedCount(list.filter((v) => !v.deactivated).length);
      setDeactivatedCount(list.filter((v) => v.deactivated).length);
      setApprovedCount(list.filter((v) => v.isApproved).length);
      setUnapprovedCount(list.filter((v) => !v.isApproved).length);
    } catch (error) {
      toast.error("Failed to fetch vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const endOffset = itemOffset + VENDORS_PER_PAGE;

    const filtered = vendors.filter((v) => {
      const matchesSearch =
        `${v.firstName} ${v.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.shopName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? !v.isDeactivated
          : v.isDeactivated;

      const matchesApproval =
        approvalFilter === "all"
          ? true
          : approvalFilter === "approved"
          ? v.isApproved === true
          : v.isApproved !== true;

      return matchesSearch && matchesStatus && matchesApproval;
    });

    setCurrentItems(filtered.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(filtered.length / VENDORS_PER_PAGE));
  }, [itemOffset, vendors, searchQuery, statusFilter, approvalFilter]);

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

  const handleBulkToggle = async (deactivate = true) => {
    if (selectedVendorIds.length === 0) {
      toast.error("No vendors selected.");
      return;
    }

    try {
      setLoading(true);
      for (const vendorId of selectedVendorIds) {
        await updateDoc(doc(db, "vendors", vendorId), {
          isDeactivated: deactivate,
        });
      }
      toast.success(
        `Selected vendors ${
          deactivate ? "deactivated" : "activated"
        } successfully.`
      );
      setSelectedVendorIds([]);
      fetchVendors();
    } catch (error) {
      toast.error("Error updating vendors.");
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
        const response = await deleteVendorAndData({ uid: vendorId });

        if (!response?.data?.success) {
          throw new Error(response?.data?.error || "Unknown error");
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

  const handleBackClick = () => {
    navigate("/dashboard");
  };

  return (
    <div className="p-6">
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-5"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-customOrange text-center">
        Vendors List
      </h1>

      <div className="flex justify-center mb-8">
        <div className="bg-customOrange p-4 w-72 rounded-lg text-center shadow-lg">
          <p className="text-white text-lg font-bold">
            Total Vendors: {totalVendors}
          </p>
          <p className="text-white text-md">Activated: {activatedCount}</p>
          <p className="text-white text-md">Deactivated: {deactivatedCount}</p>
          <p className="text-white text-md">Approved: {approvedCount}</p>
          <p className="text-white text-md">Unapproved: {unapprovedCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Search vendors..."
          className="p-2 border rounded w-full md:w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded ${
              statusFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded ${
              statusFilter === "active"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 rounded ${
              statusFilter === "deactivated"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setStatusFilter("deactivated")}
          >
            Deactivated
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded ${
                approvalFilter === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setApprovalFilter("all")}
            >
              All Approvals
            </button>
            <button
              className={`px-4 py-2 rounded ${
                approvalFilter === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setApprovalFilter("approved")}
            >
              Approved
            </button>
            <button
              className={`px-4 py-2 rounded ${
                approvalFilter === "unapproved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setApprovalFilter("unapproved")}
            >
              Unapproved
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <button
          onClick={() => {
            if (selectedVendorIds.length === 0) {
              toast.error("No vendors selected.");
              return;
            }
            setPendingAction("activate");
            setShowConfirmModal(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Activate Selected
        </button>
        <button
          onClick={() => {
            if (selectedVendorIds.length === 0) {
              toast.error("No vendors selected.");
              return;
            }
            setPendingAction("deactivate");
            setShowConfirmModal(true);
          }}
          className="bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Deactivate Selected
        </button>
        <button
          onClick={() => {
            if (selectedVendorIds.length === 0) {
              toast.error("No vendors selected.");
              return;
            }
            setPendingAction("delete");
            setShowConfirmModal(true);
          }}
          className="bg-red-700 text-white px-4 py-2 rounded"
          disabled={deleteLoading}
        >
          {deleteLoading ? "Deleting..." : "Delete Selected"}
        </button>
      </div>

      <table className="min-w-full bg-white shadow rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left">Select</th>
            <th className="p-4 text-left">Name</th>
            <th className="p-4 text-left">Email</th>
            <th className="p-4 text-left">Shop</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Approval</th>
            <th className="p-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((vendor) => (
            <tr key={vendor.id} className="border-b hover:bg-gray-50">
              <td className="p-4">
                <input
                  type="checkbox"
                  checked={selectedVendorIds.includes(vendor.id)}
                  onChange={() => handleCheckboxChange(vendor.id)}
                />
              </td>
              <td className="p-4">
                {vendor.firstName} {vendor.lastName}
              </td>
              <td className="p-4">{vendor.email}</td>
              <td className="p-4">{vendor.shopName || "No store name set"}</td>
              <td className="p-4">
                <span
                  className={`${
                    vendor.isDeactivated ? "bg-red-500" : "bg-green-500"
                  } text-white px-2 py-1 rounded-full text-xs font-poppins`}
                >
                  {vendor.isDeactivated ? "Deactivated" : "Active"}
                </span>
              </td>
              <td className="p-4">
                <span
                  className={`${
                    vendor.isApproved ? "bg-green-600" : "bg-yellow-500"
                  } text-white px-2 py-1 rounded-full text-xs font-poppins`}
                >
                  {vendor.isApproved ? "Approved" : "Unapproved"}
                </span>
              </td>
              <td className="p-4">
                <Link
                  to={`/dashboard/vendor/${vendor.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View Details
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
        pageCount={pageCount}
        onPageChange={handlePageClick}
        containerClassName={"flex justify-center mt-6 space-x-2"}
        pageClassName={"px-3 py-2 bg-gray-200 rounded"}
        activeClassName={"bg-blue-500 text-white"}
        previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
        nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
      />
      <Modal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          setShowConfirmModal(false);
          if (pendingAction === "activate") {
            await handleActivateVendors();
          } else if (pendingAction === "deactivate") {
            await handleDeactivateVendors();
          } else if (pendingAction === "delete") {
            await handleDeleteVendors();
          }
          setPendingAction(null);
        }}
        title={
          pendingAction === "delete"
            ? "Delete Vendors?"
            : pendingAction === "activate"
            ? "Activate Vendors?"
            : "Deactivate Vendors?"
        }
        message={`Are you sure you want to ${
          pendingAction === "delete"
            ? "delete"
            : pendingAction === "activate"
            ? "activate"
            : "deactivate"
        } the selected vendors? This action cannot be undone.`}
      />
    </div>
  );
}
