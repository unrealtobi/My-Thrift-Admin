import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/Login';

const PublicRoutes = () => {
  return (
    <Routes>
      {/* Redirect root path "/" to "/login" */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Public Login Route */}
      <Route path="/login" element={<AdminLogin />} />

      {/* Add any other public routes if needed */}
    </Routes>
  );
};

export default PublicRoutes;
