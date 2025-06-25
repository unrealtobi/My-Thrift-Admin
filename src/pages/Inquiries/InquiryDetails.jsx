import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";

export default function InquiryDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchInquiry = async () => {
        const ref = doc(db, "inquiries", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();

          let customerName = "";
          let vendorShopName = "";
          let productImage = "";

          if (data.userId) {
            const userSnap = await getDoc(doc(db, "users", data.userId));
            if (userSnap.exists()) {
              customerName =
                userSnap.data().displayName || userSnap.data().name || "";
            }
          }

          if (data.vendorId) {
            const vendorSnap = await getDoc(doc(db, "vendors", data.vendorId));
            if (vendorSnap.exists()) {
              vendorShopName = vendorSnap.data().shopName || "";
            }
          }

          if (data.productId) {
            const productSnap = await getDoc(
              doc(db, "products", data.productId)
            );
            if (productSnap.exists()) {
              productImage = productSnap.data().coverImageUrl || "";
            }
          }

          setInquiry({
            id: snap.id,
            ...data,
            customerName,
            vendorShopName,
            productImage,
          });
        }
        setLoading(false);
      };
      fetchInquiry();
    }
  }, [id]);

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  if (loading || !inquiry) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
      >
        <FaChevronLeft className="mr-2" /> Back
      </button>

      <h1 className="text-3xl font-bold text-customOrange font-opensans mb-4 text-center">
        Inquiry Details
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2 text-customOrange">
            Customer Info
          </h2>
          <p className="mb-1">
            <strong>Name:</strong> {inquiry.customerName || "—"}
          </p>
          <p className="mb-1">
            <strong>Email:</strong> {inquiry.email}
          </p>
          <p>
            <strong>Customer ID:</strong>{" "}
            {inquiry.customerId || inquiry.userId || "—"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2 text-customOrange">
            Product Info
          </h2>
          <p className="mb-1">
            <strong>Product:</strong>{" "}
            <Link
              to={`/dashboard/products/${inquiry.productId}`}
              className="text-blue-600 hover:underline"
            >
              {inquiry.productName}
            </Link>
          </p>
          <p className="mb-2">
            <strong>Product ID:</strong> {inquiry.productId}
          </p>
          {inquiry.productImage && (
            <img
              src={inquiry.productImage}
              alt={inquiry.productName}
              className="w-24 h-24 object-cover rounded"
            />
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2 text-customOrange">
            Vendor Info
          </h2>
          <p className="mb-1">
            <strong>Shop Name:</strong> {inquiry.vendorShopName || "—"}
          </p>
          <p className="mb-1">
            <strong>Vendor ID:</strong>{" "}
            <Link
              to={`/dashboard/vendors/${inquiry.vendorId}`}
              className="text-blue-600 hover:underline"
            >
              {inquiry.vendorId}
            </Link>
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow col-span-full">
          <h2 className="font-semibold text-lg mb-2 text-customOrange">
            Inquiry
          </h2>
          <p className="mb-2">
            <strong>Question:</strong> {inquiry.question || "—"}
          </p>
          <p className="mb-2">
            <strong>Reply:</strong> {inquiry.vendorReply || "Not replied yet"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`font-semibold ${
                inquiry.status === "closed" ? "text-green-600" : "text-blue-600"
              }`}
            >
              {inquiry.status}
            </span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-2 text-customOrange">
            Timestamps
          </h2>
          <p className="mb-1">
            <strong>Asked At:</strong> {formatDate(inquiry.createdAt)}
          </p>
          <p>
            <strong>Replied At:</strong> {formatDate(inquiry.repliedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
