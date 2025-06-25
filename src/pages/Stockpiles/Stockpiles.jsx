import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Link, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaChevronLeft } from "react-icons/fa";

export default function StockpilesList() {
  const navigate = useNavigate();
  const [stockpiles, setStockpiles] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState({});
  const [vendors, setVendors] = useState({});
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      const stockSnap = await getDocs(collection(db, "stockpiles"));
      const stockList = stockSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userIds = [...new Set(stockList.map((sp) => sp.userId))];
      const vendorIds = [...new Set(stockList.map((sp) => sp.vendorId))];

      const userData = {};
      await Promise.all(
        userIds.map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          if (snap.exists()) userData[uid] = snap.data();
        })
      );

      const vendorData = {};
      await Promise.all(
        vendorIds.map(async (vid) => {
          const snap = await getDoc(doc(db, "vendors", vid));
          if (snap.exists()) vendorData[vid] = snap.data();
        })
      );

      const productData = {};
      await Promise.all(
        stockList.map(async (sp) => {
          const firstProductId = sp.cartItems?.[0]?.productId;
          if (firstProductId && !productData[firstProductId]) {
            const snap = await getDoc(doc(db, "products", firstProductId));
            if (snap.exists()) productData[firstProductId] = snap.data();
          }
        })
      );

      setStockpiles(stockList);
      setUsers(userData);
      setVendors(vendorData);
      setProducts(productData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (ts) => ts?.toDate?.().toLocaleDateString() || "—";

  const filtered = stockpiles.filter((item) => {
    const userMatch = users[item.userId]?.displayName
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const vendorMatch = vendors[item.vendorId]?.shopName
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const statusMatch =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? item.isActive
        : !item.isActive;

    return (userMatch || vendorMatch) && statusMatch;
  });

  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const total = stockpiles.length;
  const activeCount = stockpiles.filter((sp) => sp.isActive).length;
  const inactiveCount = stockpiles.filter((sp) => !sp.isActive).length;

  const exportCSV = () => {
    const headers = ["Customer", "Vendor", "Weeks", "Start", "End", "Status"];
    const rows = filtered.map((sp) => {
      const user = users[sp.userId]?.displayName || "N/A";
      const vendor = vendors[sp.vendorId]?.shopName || "N/A";
      const weeks = `${sp.chosenWeeks} of ${sp.maxAllowedWeeks}`;
      const start = formatDate(sp.startDate);
      const end = formatDate(sp.endDate);
      const status = sp.isActive ? "Active" : "Inactive";
      return [user, vendor, weeks, start, end, status];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stockpiles.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex mb-8 items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-customOrange text-center font-bold">
          Stockpile Records
        </h1>
        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-customOrange p-4 w-64 rounded-lg text-center text-white font-semibold">
          <p>Total: {total}</p>
          <p>Active: {activeCount}</p>
          <p>Inactive: {inactiveCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user or vendor name"
          className="p-2 border border-gray-300 rounded w-full md:w-1/2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full md:w-1/4"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead className="bg-gray-100 text-left">
              <tr>
                {/* <th className="p-3">Preview</th> */}
                <th className="p-3">Customer</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Weeks</th>
                <th className="p-3">Start</th>
                <th className="p-3">End</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((sp) => {
                const user = users[sp.userId];
                const vendor = vendors[sp.vendorId];
                const product = sp.cartItems?.[0]?.productId
                  ? products[sp.cartItems[0].productId]
                  : null;

                return (
                  <tr key={sp.id} className="border-t hover:bg-gray-50">
                    {/* <td className="p-3">
                      <img
                        src={sp.cartItems?.[0]?.productImage || "/no-image.jpg"}
                        alt="Product"
                        className="w-16 h-16 object-cover rounded"
                      />
                    </td> */}
                    <td className="p-3">{user?.displayName || "N/A"}</td>
                    <td className="p-3">{vendor?.shopName || "N/A"}</td>
                    <td className="p-3">
                      {sp.chosenWeeks} of {sp.maxAllowedWeeks}
                    </td>
                    <td className="p-3">{formatDate(sp.startDate)}</td>
                    <td className="p-3">{formatDate(sp.endDate)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-sm rounded-full font-medium ${
                          sp.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/dashboard/stockpiles/${sp.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">
                    No stockpiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={pageCount}
            onPageChange={({ selected }) => setCurrentPage(selected)}
            containerClassName={"flex justify-center mt-6 space-x-2"}
            pageClassName={"px-3 py-2 bg-gray-200 rounded"}
            activeClassName={"bg-blue-500 text-white"}
            previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
            nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
          />
        </div>
      )}
    </div>
  );
}
