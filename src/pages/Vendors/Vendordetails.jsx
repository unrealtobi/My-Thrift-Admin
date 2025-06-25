import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { toast, ToastContainer } from "react-toastify";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaUserCircle,
  FaChevronLeft,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaIdCard,
  FaMapMarked,
  FaBandcamp,
  FaPhone,
} from "react-icons/fa";
import Modal from "../../components/Modal";
import ReactPaginate from "react-paginate";
import { getFunctions, httpsCallable } from "firebase/functions";
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
  FaEnvelope,
  FaClock,
} from "react-icons/fa";

export default function VendorDetails() {
  const functions = getFunctions();
  const deleteVendorAndData = httpsCallable(functions, "deleteVendorAndData");

  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [inquiries, setInquiries] = useState([]);
  const [inquiryPage, setInquiryPage] = useState(0);

  const INQUIRIES_PER_PAGE = 5;
  const paginatedInquiries = inquiries.slice(
    inquiryPage * INQUIRIES_PER_PAGE,
    (inquiryPage + 1) * INQUIRIES_PER_PAGE
  );
  const PRODUCTS_PER_PAGE = 5;
  const ORDERS_PER_PAGE = 5;
  const [productPage, setProductPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);

  const fetchVendor = async () => {
    const docRef = doc(db, "vendors", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setVendor({ id: docSnap.id, ...docSnap.data() });
    }
  };

  const fetchVendorProducts = async () => {
    const q = query(collection(db, "products"), where("vendorId", "==", id));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  const fetchVendorOrders = async () => {
    const q = query(collection(db, "orders"), where("vendorId", "==", id));
    const snapshot = await getDocs(q);

    const ordersWithImages = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const order = { id: docSnap.id, ...docSnap.data() };
        const firstItem = order.cartItems?.[0];
        let imageUrl = "";
        if (firstItem?.productId) {
          try {
            const productDoc = await getDoc(
              doc(db, "products", firstItem.productId)
            );
            imageUrl = productDoc.exists()
              ? productDoc.data().coverImageUrl
              : "";
          } catch (error) {
            imageUrl = "";
          }
        }
        return { ...order, previewImage: imageUrl };
      })
    );

    setOrders(ordersWithImages);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchVendor(),
        fetchVendorProducts(),
        fetchVendorOrders(),
      ]);
      setLoading(false);
    };
    if (id) init();
  }, [id]);

  const handleSaveChanges = async () => {
    if (!vendor) return;
    try {
      const vendorDoc = doc(db, "vendors", vendor.id);
      await updateDoc(vendorDoc, {
        shopName: vendor.shopName || "",
        email: vendor.email || "",
        phoneNumber: vendor.phoneNumber || "",
        marketPlace: vendor.marketPlace || "",
        marketPlaceType: vendor.marketPlaceType || "",
        description: vendor.description || "",
        complexName: vendor.complexName || "",
      });
      setIsEditing(false);
      toast.success("Vendor details updated successfully.");
    } catch (error) {
      toast.error("Error updating vendor details.");
    } finally {
      setShowSaveModal(false);
    }
  };

  const handleToggleApproval = async () => {
    if (!vendor || !vendor.profileComplete) return;
    const ref = doc(db, "vendors", vendor.id);
    const newStatus = !(vendor.isApproved || false);
    await updateDoc(ref, { isApproved: newStatus });
    setVendor((prev) => ({ ...prev, isApproved: newStatus }));
    toast.success(
      `Vendor ${newStatus ? "approved" : "unapproved"} successfully.`
    );
  };

  const handleToggleActivation = async () => {
    const ref = doc(db, "vendors", vendor.id);
    const newStatus = !(vendor.deactivated || false);
    await updateDoc(ref, { deactivated: newStatus });
    setVendor((prev) => ({ ...prev, deactivated: newStatus }));
    toast.success(
      `Vendor ${newStatus ? "deactivated" : "reactivated"} successfully.`
    );
  };

  const [approving, setApproving] = useState(false); // Add this if not declared

  const sendApprovalSMS = async () => {
    console.log(`Preparing to send SMS to vendor: ${vendor.phoneNumber}`);
    const userPhoneNumber = vendor.phoneNumber;
    const smsUsername =
      import.meta.env.VITE_BETASMS_USERNAME || "defaultUsername";
    const smsPassword =
      import.meta.env.VITE_BETASMS_PASSWORD || "defaultPassword";

    setApproving(true);

    try {
      if (!smsUsername || !smsPassword) {
        console.error(
          "BetaSMS credentials are missing. Ensure REACT_APP_BETASMS_USERNAME and REACT_APP_BETASMS_PASSWORD are set."
        );
        setApproving(false);
        return;
      }

      console.log("SMS credentials loaded successfully.");
      console.log(`SMS Username: ${smsUsername}`);
      // Avoid logging sensitive data like passwords
      console.log(`SMS Password: [REDACTED]`);

      const smsMessage = encodeURIComponent(
        `Hello, ${vendor.firstName}, your store "${vendor.shopName}" has been approved! You can now start listing your products on My Thrift. 🎉`
      );
      const smsSender = "My Thrift";

      const smsUrl = `http://login.betasms.com.ng/api/?username=${smsUsername}&password=${encodeURIComponent(
        smsPassword
      )}&message=${smsMessage}&sender=${encodeURIComponent(
        smsSender
      )}&mobiles=${encodeURIComponent(userPhoneNumber)}`;

      console.log(`Constructed SMS URL: ${smsUrl}`);

      const smsResponse = await fetch(smsUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("SMS request sent. Awaiting response...");
      const smsResult = await smsResponse.json();
      console.log("SMS API Response:", smsResult);

      if (smsResult.status === "OK") {
        console.log(
          `SMS sent successfully to user: ${userPhoneNumber}. Vendor has been notified of approval.`
        );
      } else {
        console.warn(
          "SMS sending failed. Check the API response for more details:",
          smsResult
        );
      }
    } catch (error) {
      console.error("Error approving vendor or sending SMS:", error);
    } finally {
      console.log(`Approval process for vendor ${vendor.id} completed.`);
      setApproving(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendor?.id) {
      toast.error("Vendor ID is missing.");
      return;
    }

    try {
      setLoading(true);
      setShowDeleteModal(false);

      const response = await fetch(
        "https://us-central1-ecommerce-ba520.cloudfunctions.net/deleteVendorAndData",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid: vendor.id }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete vendor. Server responded with status ${response.status}`
        );
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Unknown error deleting vendor");
      }

      toast.success("Vendor and related data deleted successfully.");
      navigate("/dashboard/vendors");
    } catch (error) {
      toast.error(`Error deleting vendor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Unknown";
    return timestamp.toDate().toLocaleString();
  };

  const paginatedProducts = products.slice(
    productPage * PRODUCTS_PER_PAGE,
    (productPage + 1) * PRODUCTS_PER_PAGE
  );

  const paginatedOrders = orders.slice(
    orderPage * ORDERS_PER_PAGE,
    (orderPage + 1) * ORDERS_PER_PAGE
  );

  const handleBackClick = () => {
    navigate(-1);
  };
  if (loading || !vendor) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={handleBackClick}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-5"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>
      <ToastContainer />
      <Modal
        show={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSaveChanges}
        title="Save Changes?"
        message="Are you sure you want to apply the changes to this vendor?"
      />
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor?"
        message="This will permanently delete the vendor and all associated data."
      />

      <h1 className="text-3xl font-bold mb-6 text-customOrange text-center">
        Vendor Details
      </h1>

      {/* Vendor Profile Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col items-center mb-6">
          {vendor.photoURL ? (
            <img
              src={vendor.photoURL}
              alt={vendor.shopName || "Vendor"}
              className="w-24 h-24 rounded-full shadow-lg object-cover"
            />
          ) : (
            <FaUserCircle className="text-gray-400 w-24 h-24 rounded-full shadow-lg" />
          )}
          <p className="mt-2 text-sm text-gray-600">
            Vendor ID: <span className="font-mono text-xs">{vendor.id}</span>
          </p>
          <p className="text-lg font-semibold mt-1">
            Store Name:{" "}
            <span className="text-customOrange">
              {vendor.shopName || "Not Set"}
            </span>
          </p>
        </div>

        {/* Static Info Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-4">
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaUsers className="text-customOrange w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Full Name:</strong>{" "}
              {vendor.firstName} {vendor.lastName}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaEnvelope className="text-customOrange w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Email:</strong>{" "}
              {vendor.email}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaClock className="text-customOrange w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Last Updated:</strong>{" "}
              {formatDate(vendor.lastUpdate)}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaCheckCircle className="text-customOrange w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Status:</strong>{" "}
              {vendor.deactivated ? "Deactivated" : "Active"}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaCheckCircle className="text-customOrange w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Approval:</strong>{" "}
              {vendor.isApproved ? "Approved" : "Not Approved"}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            {vendor.profileComplete ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaTimesCircle className="text-red-500 w-5 h-5" />
            )}
            <span>
              <strong className="font-semibold w-1/3">Profile Complete:</strong>{" "}
              {vendor.profileComplete ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaStar className="text-yellow-500" />
            <span>
              <strong className="font-semibold w-1/3">Rating:</strong>{" "}
              {vendor.rating || "Not Rated"}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaBox className="text-red-400 w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Total Products:</strong>{" "}
              {products.length}
            </span>
          </div>
          <div className="flex items-start border rounded-lg px-4 py-2 gap-2">
            <FaBox className="text-green-400 w-5 h-5 rounded-full shadow-lg" />
            <span>
              <strong className="font-semibold w-1/3">Total Orders:</strong>{" "}
              {orders.length}
            </span>
          </div>
        </div>

        {/* Editable Fields */}
        {[
          { label: "Phone Number", key: "phoneNumber" },
          { label: "Market Place", key: "marketPlace" },
          { label: "Market Place Type", key: "marketPlaceType" },
          { label: "Complex Name", key: "complexName" },
          { label: "Description", key: "description", multiline: true },
        ].map(({ label, key, multiline }) => (
          <div
            key={key}
            className="flex items-start mb-4 border rounded-lg px-4 py-2"
          >
            <label className="font-semibold w-1/3">{label}:</label>
            {isEditing ? (
              multiline ? (
                <textarea
                  value={vendor[key] || ""}
                  onChange={(e) =>
                    setVendor({ ...vendor, [key]: e.target.value })
                  }
                  className="w-2/3 bg-transparent border-none outline-none"
                />
              ) : (
                <input
                  type="text"
                  value={vendor[key] || ""}
                  onChange={(e) =>
                    setVendor({ ...vendor, [key]: e.target.value })
                  }
                  className="w-2/3 bg-transparent border-none outline-none"
                />
              )
            ) : (
              <p className="w-2/3 font-poppins">{vendor[key] || "Not Set"}</p>
            )}
          </div>
        ))}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4">
          {isEditing ? (
            <button
              onClick={() => setShowSaveModal(true)}
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
            onClick={handleToggleApproval}
            disabled={!vendor.profileComplete}
            className={`px-4 py-2 rounded-lg ${
              vendor.isApproved
                ? "bg-red-500 text-white"
                : vendor.profileComplete
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {vendor.isApproved ? "Unapprove Vendor" : "Approve Vendor"}
          </button>

          {!vendor.isApproved && (
            <button
              onClick={sendApprovalSMS}
              disabled={!vendor.isApproved || approving}
              className={`mt-4 px-4 py-2 rounded-lg text-white ${
                !vendor.isApproved || approving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600"
              }`}
            >
              {approving ? "Sending SMS..." : "Send Approval SMS"}
            </button>
          )}

          <button
            onClick={handleToggleActivation}
            className={`px-4 py-2 rounded-lg ${
              vendor.deactivated
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {vendor.deactivated ? "Reactivate Vendor" : "Deactivate Vendor"}
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Delete Vendor
          </button>
        </div>
      </div>

      {vendor.isApproved && (
        <div className="flex gap-4 mt-10 mb-4">
          {["products", "orders", "inquiries"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "products" ? (
        <div className="bg-white shadow rounded-lg p-6 mt-2">
          {vendor.isApproved ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Products</h2>
              {products.length === 0 ? (
                <p className="text-gray-500">
                  No products found for this vendor.
                </p>
              ) : (
                <>
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-4 text-left">Image</th>
                        <th className="p-4 text-left">Name</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4">
                            <img
                              src={product.coverImageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          </td>
                          <td className="p-4">{product.name}</td>
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs ${
                                product.published
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-400 text-white"
                              }`}
                            >
                              {product.published ? "Published" : "Unpublished"}
                            </span>
                          </td>
                          <td className="p-4">
                            <Link
                              to={`/dashboard/products/${product.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              View & Edit
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
                    pageCount={Math.ceil(products.length / PRODUCTS_PER_PAGE)}
                    onPageChange={({ selected }) => setProductPage(selected)}
                    containerClassName={"flex justify-center mt-6 space-x-2"}
                    pageClassName={"px-3 py-2 bg-gray-200 rounded"}
                    activeClassName={"bg-blue-500 text-white"}
                    previousClassName={
                      "px-3 py-2 bg-blue-500 text-white rounded"
                    }
                    nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                <label className="font-semibold w-1/3 flex items-center">
                  <FaStoreAlt className="mr-2" /> Shop Name:
                </label>
                <p className="w-2/3">{vendor.shopName || "No shop name set"}</p>
              </div>
              <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                <label className="font-semibold w-1/3 flex items-center">
                  <FaMapMarkedAlt className="mr-2" /> State:
                </label>
                <p className="w-2/3">{vendor.state}</p>
              </div>

              {vendor.bankDetails && (
                <>
                  <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                    <label className="font-semibold w-1/3 flex items-center">
                      <FaBandcamp className="mr-2" /> Bank Name:
                    </label>
                    <p className="w-2/3">{vendor.bankDetails.bankName}</p>
                  </div>
                  <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                    <label className="font-semibold w-1/3">Account Name:</label>
                    <p className="w-2/3">{vendor.bankDetails.accountName}</p>
                  </div>
                  <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                    <label className="font-semibold w-1/3">
                      Account Number:
                    </label>
                    <p className="w-2/3">{vendor.bankDetails.accountNumber}</p>
                  </div>
                </>
              )}

              <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                <label className="font-semibold w-1/3 flex items-center">
                  <FaMapMarked className="mr-2" /> Address:
                </label>
                <p className="w-2/3">{vendor.Address || "Not Provided"}</p>
              </div>
              <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                <label className="font-semibold w-1/3 flex items-center">
                  <FaIdCard className="mr-2" /> ID Verification:
                </label>
                <p className="w-2/3">
                  {vendor.idVerification || "Not Provided"}
                </p>
              </div>
              {vendor.idImage && (
                <div className="mb-4">
                  <img
                    src={vendor.idImage}
                    alt="ID Image"
                    className="w-40 h-60 rounded-lg shadow-md"
                  />
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold">Social Media:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <FaInstagram className="mr-2 text-pink-500" />
                    <a
                      href={vendor.socialMediaHandle?.instagram || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {vendor.socialMediaHandle?.instagram || "No Instagram"}
                    </a>
                  </li>
                  <li className="flex items-center">
                    <FaFacebook className="mr-2 text-blue-600" />
                    <a
                      href={vendor.socialMediaHandle?.facebook || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {vendor.socialMediaHandle?.facebook || "No Facebook"}
                    </a>
                  </li>
                  <li className="flex items-center">
                    <FaTwitter className="mr-2 text-blue-400" />
                    <a
                      href={vendor.socialMediaHandle?.twitter || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {vendor.socialMediaHandle?.twitter || "No Twitter"}
                    </a>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mt-2">
          <h2 className="text-xl font-semibold mb-4">Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found for this vendor.</p>
          ) : (
            <>
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Product</th>
                    <th className="p-4 text-left">User</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <img
                          src={order.previewImage || ""}
                          alt="Product"
                          className="w-16 h-16 object-cover rounded"
                        />
                      </td>
                      <td className="p-4">
                        {order.userInfo?.displayName || "N/A"}
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {order.progressStatus || "Pending"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          to={`/dashboard/orders/${order.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Order Details
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
                pageCount={Math.ceil(orders.length / ORDERS_PER_PAGE)}
                onPageChange={({ selected }) => setOrderPage(selected)}
                containerClassName={"flex justify-center mt-6 space-x-2"}
                pageClassName={"px-3 py-2 bg-gray-200 rounded"}
                activeClassName={"bg-blue-500 text-white"}
                previousClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
                nextClassName={"px-3 py-2 bg-blue-500 text-white rounded"}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
