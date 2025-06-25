import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import { Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";

export default function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchOrder = async () => {
        const ref = doc(db, "orders", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, [id]);

  const formatDate = (ts) => ts?.toDate?.().toLocaleString() || "—";

  const exportCSV = () => {
    if (!order) return;
    const header = ["Product ID", "Quantity", "Size", "Color"];
    const rows = order.cartItems?.map((item) => [
      item.previewImage,
      item.productId,
      item.quantity,
      item.variantAttributes?.size,
      item.variantAttributes?.color,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `order_${order.orderId}_cart.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !order) return <div className="p-6">Loading...</div>;

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <ToastContainer />

      <h1 className="text-3xl text-customOrange font-bold font-opensans mb-4">
        Order Details
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Info */}
        <div className="border rounded-lg p-4 shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4 text-customOrange">
            Order Info
          </h2>
          <p className="mb-2">
            <span className="font-medium">Order ID:</span> {order.orderId}
          </p>
          <p className="mb-2">
            <span className="font-medium">Status:</span> {order.progressStatus}
          </p>
          <p className="mb-2">
            <span className="font-medium">Payment Status:</span>{" "}
            {order.paymentStatus}
          </p>
          <p className="mb-2">
            <span className="font-medium">Subtotal:</span> ₦{order.subtotal}
          </p>
          <p className="mb-2">
            <span className="font-medium">Delivery Fee:</span> ₦
            {order.deliveryFee}
          </p>
          <p className="mb-2">
            <span className="font-medium">Total:</span> ₦{order.total}
          </p>
        </div>

        {/* Customer Info */}
        <div className="border rounded-lg p-4 shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4 text-customOrange">
            Customer Info
          </h2>
          <p className="mb-2">
            <span className="font-medium">Name:</span>{" "}
            {order.userInfo?.displayName}
          </p>
          <p className="mb-2">
            <span className="font-medium">Email:</span> {order.userInfo?.email}
          </p>
          <p className="mb-2">
            <span className="font-medium">Phone:</span>{" "}
            {order.userInfo?.phoneNumber}
          </p>
          <p className="mb-2">
            <span className="font-medium">Address:</span>{" "}
            {order.userInfo?.address}
          </p>
        </div>

        {/* Vendor Info */}
        <div className="border rounded-lg p-4 shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4 text-customOrange">
            Vendor Info
          </h2>
          <p className="mb-2">
            <span className="font-medium">Vendor ID:</span>{" "}
            <Link
              to={`/vendors/${order.userInfo?.vendorId}`}
              className="text-blue-600 underline"
            >
              {order.userInfo?.vendorId}
            </Link>
          </p>
          <p className="mb-2">
            <span className="font-medium">Status:</span>{" "}
            {order.userInfo?.vendorStatus}
          </p>
        </div>

        {/* Delivery Info */}
        <div className="border rounded-lg p-4 shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4 text-customOrange">
            Delivery Info
          </h2>
          <p className="mb-2">
            <span className="font-medium">Drop-off:</span>{" "}
            {order.deliveryInfo?.dropOffDetails?.[0]?.address}
          </p>
          <p className="mb-2">
            <span className="font-medium">Pickup:</span>{" "}
            {order.deliveryInfo?.pickupDetails?.[0]?.address}
          </p>
          <p className="mb-2">
            <span className="font-medium">Rider:</span>{" "}
            {order.riderInfo?.riderName || "—"} ({order.riderInfo?.riderNumber})
          </p>
          {order.kwikJob?.data?.pickups?.[0]?.result_tracking_link && (
            <p className="mb-2">
              <a
                href={order.kwikJob.data.pickups[0].result_tracking_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Track Delivery
              </a>
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="border rounded-lg p-4 shadow-sm bg-white col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-customOrange">
            Timeline
          </h2>
          <p className="mb-2">
            <span className="font-medium">Created At:</span>{" "}
            {formatDate(order.createdAt)}
          </p>
          <p className="mb-2">
            <span className="font-medium">Shipped At:</span>{" "}
            {formatDate(order.shippedAt)}
          </p>
          <p className="mb-2">
            <span className="font-medium">Delivered At:</span>{" "}
            {formatDate(order.deliveredAt)}
          </p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow-sm mt-8">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-customOrange">
            Cart Items
          </h2>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Image</th>
              <th className="p-3 text-left">Product ID</th>
              <th className="p-3 text-left">Quantity</th>
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Color</th>
            </tr>
          </thead>
          <tbody>
            {order.cartItems?.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {item.previewImage ? (
                    <img
                      src={item.previewImage}
                      alt="Product"
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded" />
                  )}
                </td>
                <td className="p-3">
                  <Link
                    to={`/dashboard/products/${item.productId}`}
                    className="text-blue-600 underline"
                  >
                    {item.productId}
                  </Link>
                </td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{item.variantAttributes?.size}</td>
                <td className="p-3">{item.variantAttributes?.color}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
