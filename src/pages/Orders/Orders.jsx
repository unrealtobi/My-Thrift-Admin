import React, { useEffect, useState } from "react";
import { db } from "../../firebase.config";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import { CSVLink } from "react-csv";

export default function OrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedVendors, setExpandedVendors] = useState({});
  const VENDORS_PER_PAGE = 5;

  useEffect(() => {
    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const order = { id: docSnap.id, ...docSnap.data() };

          const firstItem = order.cartItems?.[0];
          if (firstItem?.productId) {
            const productDoc = await getDoc(
              doc(db, "products", firstItem.productId)
            );
            order.previewImage = productDoc.exists()
              ? productDoc.data().coverImageUrl
              : "";
          }

          if (order.vendorId) {
            const vendorDoc = await getDoc(doc(db, "vendors", order.vendorId));
            order.vendorShopName = vendorDoc.exists()
              ? vendorDoc.data().shopName
              : "No store name set";
          }

          return order;
        })
      );
      setOrders(data);
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter((order) => {
    const name = order.userInfo?.displayName?.toLowerCase() || "";
    const vendor = order.vendorShopName?.toLowerCase() || "";
    const orderId = order.orderId?.toLowerCase() || "";
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      vendor.includes(search.toLowerCase()) ||
      orderId.includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || order.progressStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Group orders by vendor
  const vendorGroups = {};
  filtered.forEach((order) => {
    const vendor = order.vendorShopName || "Unknown Vendor";
    if (!vendorGroups[vendor]) vendorGroups[vendor] = [];
    vendorGroups[vendor].push(order);
  });

  const vendorNames = Object.keys(vendorGroups);
  const totalPages = Math.ceil(vendorNames.length / VENDORS_PER_PAGE);
  const paginatedVendorNames = vendorNames.slice(
    currentPage * VENDORS_PER_PAGE,
    (currentPage + 1) * VENDORS_PER_PAGE
  );

  const groupedOrders = paginatedVendorNames.reduce((acc, vendor) => {
    acc[vendor] = vendorGroups[vendor];
    return acc;
  }, {});

  const handlePageClick = ({ selected }) => setCurrentPage(selected);

  const handleViewEdit = (id) => {
    navigate(`/dashboard/orders/${id}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-200 text-green-700";
      case "Pending":
        return "bg-yellow-200 text-yellow-700";
      case "In Progress":
        return "bg-blue-200 text-blue-700";
      case "Declined":
        return "bg-red-200 text-red-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const totalOrders = orders.length;
  const deliveredCount = orders.filter((o) => o.progressStatus === "Delivered")
    .length;
  const declinedCount = orders.filter((o) => o.progressStatus === "Declined")
    .length;
  const inProgressCount = orders.filter(
    (o) => o.progressStatus === "In Progress"
  ).length;
  const pendingCount = orders.filter((o) => o.progressStatus === "Pending")
    .length;

  return (
    <div className="p-6">
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <h1 className="text-4xl text-customOrange font-bold font-opensans mt-5 mb-4 text-center">
        Orders List
      </h1>

      {/* Summary Card */}
      <div className="flex justify-center mb-8">
        <div className="bg-customOrange p-4 w-64 rounded-lg text-center">
          <p className="text-white text-lg font-bold">
            Total Orders: {totalOrders}
          </p>
          <p className="text-white text-sm">Delivered: {deliveredCount}</p>
          <p className="text-white text-sm">Declined: {declinedCount}</p>
          <p className="text-white text-sm">In Progress: {inProgressCount}</p>
          <p className="text-white text-sm">Pending: {pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by name, vendor, or order ID"
          className="p-2 border rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Statuses</option>
          <option value="Delivered">Delivered</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Declined">Declined</option>
        </select>

        <CSVLink
          data={filtered.map((o) => ({
            OrderID: o.orderId,
            Customer: o.userInfo?.displayName || "Unknown",
            Vendor: o.vendorShopName || "No store name set",
            Status: o.progressStatus,
            Amount: o.total,
            OrderDate: o.createdAt?.toDate?.().toLocaleDateString() || "—",
          }))}
          filename={`orders_export.csv`}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export CSV
        </CSVLink>
      </div>

      {/* Table */}
      <table className="min-w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4 text-left">Image</th>
            <th className="p-4 text-left">Order ID</th>
            <th className="p-4 text-left">Customer</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Amount</th>
            <th className="p-4 text-left">Order Date</th>
            <th className="p-4 text-left">Vendor</th>
            <th className="p-4 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedOrders).map(([vendor, vendorOrders]) => (
            <React.Fragment key={vendor}>
              <tr className="bg-gray-200">
                <td colSpan={8} className="p-4 font-semibold text-lg">
                  <button
                    onClick={() =>
                      setExpandedVendors((prev) => ({
                        ...prev,
                        [vendor]: !prev[vendor],
                      }))
                    }
                    className="hover:underline"
                  >
                    {expandedVendors[vendor] ? "▼" : "►"} {vendor} (
                    {vendorOrders.length})
                  </button>
                </td>
              </tr>
              {expandedVendors[vendor] &&
                vendorOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {order.previewImage ? (
                        <img
                          src={order.previewImage}
                          alt="Product"
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded" />
                      )}
                    </td>
                    <td className="p-4">{order.orderId}</td>
                    <td className="p-4">
                      {order.userInfo?.displayName || "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                          order.progressStatus
                        )}`}
                      >
                        {order.progressStatus || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      ₦{parseFloat(order.total || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {order.createdAt?.toDate?.().toLocaleDateString() || "—"}
                    </td>
                    <td className="p-4">{order.vendorShopName}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewEdit(order.id)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={totalPages}
        onPageChange={handlePageClick}
        containerClassName={"flex justify-center mt-6 space-x-2"}
        pageClassName={"px-3 py-2 bg-gray-200 rounded"}
        activeClassName={"bg-blue-500 text-white"}
        previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
        nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
      />
    </div>
  );
}
