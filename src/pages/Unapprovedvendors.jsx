import React, { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase.config";
import { FaChevronLeft, FaUserCircle, FaStoreAlt, FaMapMarkedAlt, FaInfoCircle, FaPhone, FaEnvelope } from "react-icons/fa";
import { RotatingLines } from "react-loader-spinner";
import { useNavigate } from "react-router-dom"; // For navigating back

const UnapprovedVendors = () => {
  const [unapprovedVendors, setUnapprovedVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const fetchUnapprovedVendors = async () => {
      setLoading(true);
      try {
        const vendorsSnapshot = await getDocs(
          query(collection(db, "vendors"), where("isApproved", "==", false))
        );
        const vendorsList = vendorsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUnapprovedVendors(vendorsList);
      } catch (error) {
        console.error("Error fetching unapproved vendors: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnapprovedVendors();
  }, []);

  const handleBackClick = () => {
    navigate("/dashboard"); // Navigate back to dashboard
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handleBackClick}
          className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center"
        >
          <FaChevronLeft className="mr-2" />
          Back
        </button>
        <h1 className="text-3xl text-customOrange font-bold font-opensans">
          Unapproved Vendors
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <RotatingLines strokeColor="purple" width="50" visible={true} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {unapprovedVendors.length === 0 ? (
            <p>No unapproved vendors found.</p>
          ) : (
            unapprovedVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex justify-center mb-6">
                  {vendor.photoURL ? (
                    <img
                      src={vendor.photoURL}
                      alt={vendor.shopName}
                      className="w-24 h-24 rounded-full shadow-lg"
                    />
                  ) : (
                    <FaUserCircle className="text-gray-400 w-24 h-24 rounded-full shadow-lg" />
                  )}
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3">Shop Name:</label>
                  <p className="w-2/3 font-poppins">
                    {vendor.shopName || "No shop name set"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaEnvelope className="mr-2" />
                    Email:
                  </label>
                  <p className="w-2/3 font-poppins">{vendor.email}</p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaPhone className="mr-2" />
                    Phone Number:
                  </label>
                  <p className="w-2/3 font-poppins">{vendor.phoneNumber}</p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaStoreAlt className="mr-2" />
                    Market Place:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {vendor.marketPlace || "Not Set"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaMapMarkedAlt className="mr-2" />
                    Market Place Type:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {vendor.marketPlaceType || "Not Set"}
                  </p>
                </div>

                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    Description:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {vendor.description || "No Description"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UnapprovedVendors;
