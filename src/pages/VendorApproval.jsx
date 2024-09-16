import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.config'; // Firestore database connection
import { toast } from 'react-toastify';

const VendorApproval = () => {
  const [pendingVendors, setPendingVendors] = useState([]);

  useEffect(() => {
    // Fetch vendors where isApproved is false
    const fetchPendingVendors = async () => {
      try {
        const q = query(collection(db, 'vendors'), where('isApproved', '==', false));
        const querySnapshot = await getDocs(q);
        const vendors = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setPendingVendors(vendors);
      } catch (error) {
        toast.error("Failed to fetch pending vendors");
      }
    };

    fetchPendingVendors();
  }, []);

  // Function to approve a vendor
  const approveVendor = async (vendorId) => {
    try {
      const vendorRef = doc(db, 'vendors', vendorId);
      await updateDoc(vendorRef, { isApproved: true });
      setPendingVendors(pendingVendors.filter((vendor) => vendor.id !== vendorId)); // Remove from the pending list
      toast.success("Vendor approved successfully");
    } catch (error) {
      toast.error("Failed to approve vendor");
    }
  };

  return (
    <div>
      <h2>Pending Vendor Approvals</h2>
      {pendingVendors.length === 0 ? (
        <p>No vendors pending approval</p>
      ) : (
        <ul>
          {pendingVendors.map((vendor) => (
            <li key={vendor.id}>
              {vendor.firstName} {vendor.lastName} - {vendor.email}
              <button onClick={() => approveVendor(vendor.id)}>Approve</button>
              {/* You can add a reject button here if you want */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VendorApproval;
