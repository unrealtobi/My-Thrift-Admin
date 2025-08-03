import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, functions } from "../firebase.config";
import {
  FaChevronLeft,
  FaUserCircle,
  FaStoreAlt,
  FaMapMarkedAlt,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaBandcamp,
  FaMapMarked,
  FaTwitter,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";
import { RotatingLines } from "react-loader-spinner";
import { useNavigate } from "react-router-dom"; // For navigating back
import { httpsCallable } from "firebase/functions";
const UnapprovedVendors = () => {
  const [unapprovedVendors, setUnapprovedVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState("");
  const [idImageUrls, setIdImageUrls] = useState({});

  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const fetchUnapprovedVendors = async () => {
      setLoading(true);

      // 0) Who is the current user + do they have admin claims?
      try {
        const cur = auth.currentUser;
        if (!cur) {
          console.warn(
            "[Admin check] No current user. Callable will fail with unauthenticated."
          );
        } else {
          const tokenRes = await cur.getIdTokenResult();
          console.log(
            "[Admin check] uid:",
            cur.uid,
            "email:",
            cur.email,
            "claims:",
            tokenRes.claims
          );
          if (!tokenRes.claims?.admin) {
            console.warn(
              "[Admin check] Current user does NOT have admin=true. Callable will  'permission-denied'."
            );
          }
        }
      } catch (e) {
        console.warn("[Admin check] Could not read token claims:", e);
      }

      try {
        // 1) Fetch vendors
        const qSnap = await getDocs(
          query(collection(db, "vendors"), where("isApproved", "==", false))
        );

        const vendorsList = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log(
          `[Vendors] Found ${vendorsList.length} unapproved vendor(s).`,
          vendorsList
        );

        // 2) Log per vendor the relevant ID fields
        vendorsList.forEach((v) => {
          console.log(
            `[Vendor] id=${v.id} shop=${
              v.shopName ?? "(no name)"
            } | idUploaded=${!!v.idUploaded} | idPath=${v.idPath ?? "(none)"}`
          );
        });

        setUnapprovedVendors(vendorsList);

        // 3) Prepare callable (log region sanity)
        console.log(
          "[Functions] Using callable getVendorIdImageUrl with region bound at initialization:",
          functions?.region || "(default)"
        );

        const getUrl = httpsCallable(functions, "getVendorIdImageUrl");

        // 4) Fetch signed URLs for those who have an ID (idUploaded OR idPath)
        await Promise.all(
          vendorsList.map(async (v) => {
            if (!v.idUploaded && !v.idPath) {
              console.log(
                `[ID Fetch] Skip ${v.id}: neither idUploaded nor idPath present.`
              );
              return;
            }
            const t0 = performance.now();
            try {
              console.log(
                `[ID Fetch] Requesting signed URL for vendor=${v.id}…`
              );
              const { data } = await getUrl({ vendorId: v.id });
              const t1 = performance.now();
              console.log(
                `[ID Fetch] ✅ Success for ${v.id} in ${(t1 - t0).toFixed(
                  0
                )}ms. URL length=${(data?.url || "").length}`
              );
              setIdImageUrls((m) => ({ ...m, [v.id]: data.url }));
            } catch (e) {
              const t1 = performance.now();
              // Log structured error info from callable
              const { code, message, details } = e || {};
              console.warn(
                `[ID Fetch] ❌ Failed for ${v.id} in ${(t1 - t0).toFixed(
                  0
                )}ms. code=${code} message=${message} details=`,
                details
              );
            }
          })
        );
      } catch (error) {
        console.error("[Vendors] Error fetching unapproved vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnapprovedVendors();
  }, []);

  const handleBackClick = () => {
    navigate("/dashboard"); // Navigate back to dashboard
  };

  const approveVendor = async (vendor) => {
    console.log(
      `Starting approval process for vendor: ${vendor.shopName} (ID: ${vendor.id})`
    );
    setApproving(vendor.id); // Track the vendor being approved

    try {
      console.log(`Updating Firestore for vendor: ${vendor.id}`);
      // Update vendor approval status in Firestore
      await updateDoc(doc(db, "vendors", vendor.id), { isApproved: true });
      console.log(`Firestore updated successfully for vendor: ${vendor.id}`);

      // Remove approved vendor from the list
      setUnapprovedVendors((prevVendors) =>
        prevVendors.filter((v) => v.id !== vendor.id)
      );
      console.log(`Vendor removed from the unapproved list: ${vendor.id}`);

      // Send SMS notification to the vendor
      console.log(`Preparing to send SMS to vendor: ${vendor.phoneNumber}`);
      const userPhoneNumber = vendor.phoneNumber;
      const smsUsername =
        import.meta.env.VITE_BETASMS_USERNAME || "defaultUsername";
      const smsPassword =
        import.meta.env.VITE_BETASMS_PASSWORD || "defaultPassword";

      if (!smsUsername || !smsPassword) {
        console.error(
          "BetaSMS credentials are missing. Ensure REACT_APP_BETASMS_USERNAME and REACT_APP_BETASMS_PASSWORD are set."
        );
        setApproving("");
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
      setApproving("");
    }
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
              <div
                key={vendor.id}
                className="bg-white shadow-lg rounded-lg p-6"
              >
                {/* Vendor Cover Image */}
                <div className="flex justify-center mb-6">
                  {vendor.coverImageUrl ? (
                    <img
                      src={vendor.coverImageUrl}
                      alt={vendor.shopName}
                      className="w-24 h-24 object-cover rounded-full shadow-lg"
                    />
                  ) : (
                    <FaUserCircle className="text-gray-400 w-24 h-24 rounded-full shadow-lg" />
                  )}
                </div>

                {/* Vendor Details */}
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

                {/* Bank Details */}
                {vendor.bankDetails && (
                  <>
                    <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                      <label className="font-semibold w-1/3 flex items-center">
                        <FaBandcamp className="mr-2" />
                        Bank Name:
                      </label>
                      <p className="w-2/3 font-poppins">
                        {vendor.bankDetails.bankName}
                      </p>
                    </div>

                    <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                      <label className="font-semibold w-1/3">
                        Account Name:
                      </label>
                      <p className="w-2/3 font-poppins">
                        {vendor.bankDetails.accountName}
                      </p>
                    </div>

                    <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                      <label className="font-semibold w-1/3">
                        Account Number:
                      </label>
                      <p className="w-2/3 font-poppins">
                        {vendor.bankDetails.accountNumber}
                      </p>
                    </div>
                  </>
                )}

                {/* State */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaMapMarkedAlt className="mr-2" />
                    State:
                  </label>
                  <p className="w-2/3 font-poppins">{vendor.state}</p>
                </div>
                {/* Recipient Code */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaInfoCircle className="mr-2" />
                    Recipient Code:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {vendor.recipientCode || "Not Provided"}
                  </p>
                </div>
                {/* Social Media Links */}
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
                {/* Vendor Address */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaMapMarked className="mr-2" />
                    Address:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {vendor.Address || "Not Provided"}
                  </p>
                </div>

                {/* ID Verification */}
                <div className="flex items-center mb-4 border rounded-lg px-4 py-2">
                  <label className="font-semibold w-1/3 flex items-center">
                    <FaIdCard className="mr-2" />
                    ID Verification:
                  </label>
                  <p className="w-2/3 font-poppins">
                    {vendor.idUploaded ? "Uploaded" : "Not Provided"}
                  </p>
                </div>

                {vendor.idUploaded && (
                  <div className="mb-4">
                    {idImageUrls[vendor.id] ? (
                      <img
                        src={idImageUrls[vendor.id]}
                        alt="Vendor ID"
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    ) : (
                      <p className="text-xs italic">Loading ID…</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => approveVendor(vendor)}
                  className={`${
                    approving === vendor.id ? "bg-gray-400" : "bg-customOrange"
                  } text-white px-4 py-2 rounded-lg w-full`}
                  disabled={approving === vendor.id}
                >
                  {approving === vendor.id ? "Approving..." : "Approve Vendor"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UnapprovedVendors;
