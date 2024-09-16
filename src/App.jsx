import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicRoutes from "./Routes/Publicroutes"; // Assuming correct path
import AdminRoutes from "./Routes/Adminroutes"; // Assuming correct path
import { Toaster } from "react-hot-toast"; // Import Toaster from react-hot-toast
import { AuthProvider } from "./Hooks/useAuth";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          {/* Toaster for react-hot-toast notifications */}
          <Toaster 
            position="top-right" // You can change the position if necessary
            reverseOrder={false} // The newest toast will appear at the bottom
          />

          {/* Define Routes */}
          <Routes>
            {/* Public routes (like login, sign-up) */}
            <Route path="/*" element={<PublicRoutes />} />

            {/* Admin routes (like dashboard, vendor approval) */}
            <Route path="/dashboard/*" element={<AdminRoutes />} />

            {/* Add a fallback route (404 or redirect) */}
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
