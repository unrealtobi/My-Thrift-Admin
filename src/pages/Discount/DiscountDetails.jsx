// File: src/pages/admin/discounts/[id].jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { db } from "../../firebase.config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChevronLeft } from "react-icons/fa";

export default function DiscountDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [discount, setDiscount] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  useEffect(() => {
    const fetchDiscountAndProduct = async () => {
      try {
        const ref = doc(db, "discounts", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const discountData = { id: snap.id, ...snap.data() };
          setDiscount(discountData);

          // Fetch product linked to this discount
          const q = query(
            collection(db, "products"),
            where("discountId", "==", snap.id)
          );
          const productSnap = await getDocs(q);
          if (!productSnap.empty) {
            const prodDoc = productSnap.docs[0];
            setProduct({ id: prodDoc.id, ...prodDoc.data() });
          }
        }
      } catch (error) {
        toast.error("Failed to fetch discount data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDiscountAndProduct();
  }, [id]);

  const toggleStatus = async () => {
    try {
      const ref = doc(db, "discounts", id);
      await updateDoc(ref, { isActive: !discount.isActive });
      setDiscount((prev) => ({ ...prev, isActive: !prev.isActive }));
      toast.success("Discount status updated.");
    } catch (error) {
      toast.error("Error updating discount status.");
    }
  };

  if (loading || !discount) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex mb-8 items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>
      <ToastContainer />
      <h1 className="text-3xl font-bold text-customOrange text-center">
        Discount Details
      </h1>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-4">
        <button
          onClick={toggleStatus}
          className={`px-4 py-2 rounded text-white ${
            discount.isActive ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {discount.isActive ? "Deactivate" : "Activate"} Discount
        </button>
      </div>

      {/* Discount Info */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold text-customOrange mb-4">
          Discount Info
        </h2>
        <p>
          <strong>Initial Price:</strong> ₦{discount.initialPrice}
        </p>
        <p>
          <strong>Discount Price:</strong> ₦{discount.discountPrice}
        </p>
        <p>
          <strong>Percentage Cut:</strong> {discount.percentageCut}%
        </p>
        <p>
          <strong>Subtractive Value:</strong> ₦{discount.subtractiveValue}
        </p>
        <p>
          <strong>Type:</strong> {discount.type}
        </p>
        <p>
          <strong>Sub Type:</strong> {discount.discountSubType}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={`px-2 py-1 text-sm rounded-full font-medium ${
              discount.isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {discount.isActive ? "Active" : "Inactive"}
          </span>
        </p>
      </div>

      {/* Vendor Info */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold text-customOrange mb-4">
          Vendor Info
        </h2>
        <p>
          <strong>Vendor ID:</strong>{" "}
          <Link
            to={`/dashboard/vendors/${discount.vendorId}`}
            className="text-blue-600 underline"
          >
            {discount.vendorId}
          </Link>
        </p>
        <p>
          <strong>Created At:</strong> {formatDate(discount.createdAt)}
        </p>
      </div>

      {/* Linked Product */}
      {product && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold text-customOrange mb-4">
            Linked Product
          </h2>
          <div className="flex gap-4 items-center">
            <img
              src={product.coverImageUrl}
              alt={product.name}
              className="w-24 h-24 object-cover rounded"
            />
            <div>
              <p>
                <strong>Name:</strong>{" "}
                <Link
                  to={`/dashboard/products/${product.id}`}
                  className="text-blue-600 underline"
                >
                  {product.name}
                </Link>
              </p>
              <p>
                <strong>Product ID:</strong> {product.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
