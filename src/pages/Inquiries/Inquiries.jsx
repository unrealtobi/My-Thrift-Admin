import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Link, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaChevronLeft } from "react-icons/fa";

export default function InquiriesList() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [vendorOptions, setVendorOptions] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const INQUIRIES_PER_PAGE = 10;

  useEffect(() => {
    const fetchInquiries = async () => {
      const ref = collection(db, "inquiries");
      const snap = await getDocs(ref);
      const list = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let vendorShopName = data.vendorShopName || "";
          let customerName = data.customerName || "";

          if (!vendorShopName && data.vendorId) {
            const vendorRef = doc(db, "vendors", data.vendorId);
            const vendorDoc = await getDoc(vendorRef);
            if (vendorDoc.exists()) {
              vendorShopName = vendorDoc.data().shopName || "";
            }
          }

          if (!customerName) {
            if (data.userId) {
              const userRef = doc(db, "users", data.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                customerName =
                  userDoc.data().displayName || userDoc.data().name || "";
              }
            }

            // Fallback: try to find user by email
            if (!customerName && data.email) {
              const usersRef = collection(db, "users");
              const allUsersSnap = await getDocs(usersRef);
              const matchedUser = allUsersSnap.docs.find(
                (u) =>
                  u.data().email?.toLowerCase() === data.email?.toLowerCase()
              );
              if (matchedUser) {
                customerName =
                  matchedUser.data().displayName ||
                  matchedUser.data().name ||
                  matchedUser.data().username ||
                  "";
              }
            }
          }

          return {
            id: docSnap.id,
            ...data,
            vendorShopName,
            customerName,
          };
        })
      );

      // newest first
      list.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );

      setInquiries(list);
      setFilteredInquiries(list);
      const vendorNames = [
        ...new Set(list.map((item) => item.vendorShopName).filter(Boolean)),
      ];
      setVendorOptions(vendorNames);
    };

    fetchInquiries();
  }, []);

  useEffect(() => {
    const filtered = inquiries.filter((item) => {
      const matchSearch =
        item.email?.toLowerCase().includes(search.toLowerCase()) ||
        item.productName?.toLowerCase().includes(search.toLowerCase()) ||
        item.vendorShopName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      const matchVendor = vendorFilter
        ? item.vendorShopName === vendorFilter
        : true;
      return matchSearch && matchStatus && matchVendor;
    });
    setFilteredInquiries(filtered);
    setItemOffset(0);
  }, [search, statusFilter, vendorFilter, inquiries]);

  const getStatusClass = (status) => {
    return status === "closed"
      ? "text-green-600 font-semibold"
      : "text-blue-600 font-semibold";
  };

  const pageCount = Math.ceil(filteredInquiries.length / INQUIRIES_PER_PAGE);
  const currentItems = filteredInquiries.slice(
    itemOffset,
    itemOffset + INQUIRIES_PER_PAGE
  );

  const handlePageClick = (event) => {
    // set explicit offset (avoids modulo by zero)
    const newOffset = event.selected * INQUIRIES_PER_PAGE;
    setItemOffset(newOffset);
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
      <h1 className="text-3xl font-bold text-customOrange mb-6 text-center font-opensans">
        Customer Inquiries
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6 justify-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, product or vendor name"
          className="p-2 border border-gray-300 rounded w-full md:w-1/2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full md:w-1/4"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full md:w-1/4"
        >
          <option value="">All Vendors</option>
          {vendorOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg shadow">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Email</th>
              <th className="p-4">Vendor Shop</th>
              <th className="p-4">Product</th>
              <th className="p-4">Question</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((inquiry) => (
              <tr key={inquiry.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{inquiry.customerName || "—"}</td>
                <td className="p-4">{inquiry.email}</td>
                <td className="p-4">{inquiry.vendorShopName || "—"}</td>
                <td className="p-4">{inquiry.productName}</td>
                <td className="p-4 truncate max-w-xs">
                  {inquiry.question?.split(" ").slice(0, 5).join(" ") + "..."}
                </td>
                <td
                  className={`p-4 capitalize ${getStatusClass(inquiry.status)}`}
                >
                  {inquiry.status}
                </td>
                <td className="p-4">
                  <Link
                    to={`/dashboard/inquiries/${inquiry.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReactPaginate
        previousLabel={"Previous"}
        nextLabel={"Next"}
        breakLabel={"..."}
        pageCount={pageCount}
        onPageChange={handlePageClick}
        containerClassName="flex justify-center mt-6 space-x-2"
        pageClassName="px-3 py-2 bg-gray-200 rounded"
        activeClassName="bg-blue-500 text-white"
        previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
        nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
      />
    </div>
  );
}
