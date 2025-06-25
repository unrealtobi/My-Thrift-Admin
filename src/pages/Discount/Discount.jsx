// File: src/pages/admin/discounts/index.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Link, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaChevronLeft } from "react-icons/fa";

export default function DiscountList() {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const fetchDiscounts = async () => {
    const discountSnap = await getDocs(collection(db, "discounts"));
    const discountList = discountSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDiscounts(discountList);

    // Fetch all products that have a discountId
    const q = query(collection(db, "products"), where("discountId", "!=", ""));
    const productSnap = await getDocs(q);
    const productList = productSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProducts(productList);
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const filtered = discounts
    .filter((discount) => {
      const product = products.find((p) => p.discountId === discount.id);
      const matchesSearch =
        discount.type?.toLowerCase().includes(search.toLowerCase()) ||
        discount.vendorId?.toLowerCase().includes(search.toLowerCase()) ||
        product?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === ""
          ? true
          : statusFilter === "active"
          ? discount.isActive
          : !discount.isActive;
      return matchesSearch && matchesStatus;
    })
    .map((discount) => {
      const product = products.find((p) => p.discountId === discount.id);
      return {
        ...discount,
        productName: product?.name || "—",
        productImage: product?.coverImageUrl || "",
        vendorShop: product?.vendorName || "—",
      };
    });

  const totalDiscounts = discounts.length;
  const totalActive = discounts.filter((d) => d.isActive).length;
  const totalInactive = totalDiscounts - totalActive;

  const pageCount = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );
  const handleBackClick = () => navigate(-1);

  return (
    <div className="p-6">
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex mb-8 items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>
      <h1 className="text-3xl font-bold text-customOrange mb-6 text-center">
        Discounts
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
          Total Discounts: <strong>{totalDiscounts}</strong>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
          Active: <strong>{totalActive}</strong>
        </div>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
          Inactive: <strong>{totalInactive}</strong>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by type, vendor ID, or product name"
          className="p-2 border border-gray-300 rounded w-full md:w-1/2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full md:w-1/4"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Product</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Initial Price</th>
              <th className="p-3">Discount Price</th>
              <th className="p-3">% Cut</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((discount) => (
              <tr key={discount.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <img
                    src={discount.productImage}
                    alt={discount.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                </td>
                <td className="p-3">{discount.productName}</td>
                <td className="p-3">{discount.vendorShop}</td>
                <td className="p-3">₦{discount.initialPrice}</td>
                <td className="p-3">₦{discount.discountPrice}</td>
                <td className="p-3">{discount.percentageCut}%</td>
                <td className="p-3 capitalize">{discount.type}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-sm rounded-full font-medium ${
                      discount.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {discount.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <Link
                    to={`/dashboard/discounts/${discount.id}`}
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
        onPageChange={({ selected }) => setCurrentPage(selected)}
        containerClassName={"flex justify-center mt-6 space-x-2"}
        pageClassName={"px-3 py-2 bg-gray-200 rounded"}
        activeClassName={"bg-blue-500 text-white"}
        previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
        nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
      />
    </div>
  );
}
