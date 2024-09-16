import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../Components/AdminRules/Privateroutes";
import AdminDashboard from "../pages/AdminDashboard";
import VendorApproval from "../pages/VendorApproval";
import ManageUsers from "../pages/ManageUsers";
const AdminRoutes = () => {
  return (
    <Routes>
      {/* Admin Dashboard Route */}
      <Route
        path=""
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      {/* Vendor Approval Route */}
      <Route
        path="vendors"
        element={
          <PrivateRoute>
            <VendorApproval />
          </PrivateRoute>
        }
      />
      <Route
      path="manageusers"
      element={
        <PrivateRoute>
          <ManageUsers />
        </PrivateRoute>
      }
      />
    </Routes>
  );
};

export default AdminRoutes;
