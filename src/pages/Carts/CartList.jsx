// File: src/pages/admin/carts/index.jsx

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { FaChevronLeft } from "react-icons/fa";

export default function CartList() {
  const [carts, setCarts] = useState([]);
  const [paginated, setPaginated] = useState([]);
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  useEffect(() => {
    const fetchCarts = async () => {
      const snap = await getDocs(collection(db, "carts"));

      const data = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const cartData = docSnap.data();
          const productsObj = cartData.products || {};
          const productList = Object.values(productsObj);

          let vendorName = "Unknown Vendor";

          if (productList.length > 0 && productList[0].vendorId) {
            try {
              const vendorSnap = await getDoc(
                doc(db, "vendors", productList[0].vendorId)
              );
              if (vendorSnap.exists()) {
                vendorName = vendorSnap.data().shopName || "Unnamed Vendor";
              }
            } catch (e) {
              console.error("Error fetching vendor:", e);
            }
          }

          return {
            id: docSnap.id,
            vendorName,
            totalProducts: productList.length,
            hasProducts: productList.length > 0,
          };
        })
      );

      const sorted = data.sort((a, b) =>
        a.hasProducts === b.hasProducts ? 0 : a.hasProducts ? -1 : 1
      );

      setCarts(sorted);
      setPaginated(sorted.slice(0, PER_PAGE));
    };

    fetchCarts();
  }, []);

  const handlePageChange = ({ selected }) => {
    setPage(selected);
    const start = selected * PER_PAGE;
    const end = start + PER_PAGE;
    setPaginated(carts.slice(start, end));
  };

  return (
    <div className="p-6">
      <button
        onClick={() => window.history.back()}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-4"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6 text-customOrange">Carts</h1>

      <div className="overflow-x-auto bg-white border rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Vendor</th>
              <th className="p-4">Product Count</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((cart) => (
              <tr key={cart.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{cart.vendorName}</td>
                <td className="p-4">
                  {cart.totalProducts > 0
                    ? cart.totalProducts
                    : "No products in cart"}
                </td>
                <td className="p-4">
                  <Link
                    to={`/dashboard/carts/${cart.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Cart
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
        pageCount={Math.ceil(carts.length / PER_PAGE)}
        onPageChange={handlePageChange}
        containerClassName="flex justify-center mt-6 space-x-2"
        pageClassName="px-3 py-2 bg-gray-200 rounded"
        activeClassName="bg-blue-600 text-white"
        previousClassName="px-3 py-2 bg-blue-500 text-white rounded"
        nextClassName="px-3 py-2 bg-blue-500 text-white rounded"
      />
    </div>
  );
}
