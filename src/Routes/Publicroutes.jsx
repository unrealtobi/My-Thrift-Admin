// routes/PublicRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLogin from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';
const PublicRoutes = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<AdminLogin />} />
      {/* <Route path="/dashboard" element={<AdminDashboard/>}/> */}
    </Routes>

  );
};

export default PublicRoutes;
