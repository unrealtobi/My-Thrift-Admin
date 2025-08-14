import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../Components/AdminRules/Privateroutes";
import AdminDashboard from "../pages/AdminDashboard";
import UnapprovedVendors from "../pages/Unapprovedvendors";
import VendorApproval from "../pages/VendorApproval";
import ManageUsers from "../pages/ManageUsers";
import ProductList from "../pages/Products/Products";
import ProductDetail from "../pages/Products/ProductDetails";
import OrderList from "../pages/Orders/Orders";
import OrderDetails from "../pages/Orders/OrderDetails";
import VendorList from "../pages/Vendors/Vendors";
import VendorDetails from "../pages/Vendors/Vendordetails";
import PushNotifs from "../pages/PushNotifs/Pushnotifs";
import InquiriesList from "../pages/Inquiries/Inquiries";
import InquiryDetails from "../pages/Inquiries/InquiryDetails";
import DiscountList from "../pages/Discount/Discount";
import DiscountDetails from "../pages/Discount/DiscountDetails";
import SubscriptionList from "../pages/Subscriptions/Subscription";
import StockpilesList from "../pages/Stockpiles/Stockpiles";
import StockpileDetails from "../pages/Stockpiles/StockpileDetails";
import FeedbackList from "../pages/Feedbacks/Feedbacks";
import FeedbackDetails from "../pages/Feedbacks/FeedbackDetails";
import UserList from "../pages/Users/Users";
import UserDetails from "../pages/Users/UsersDetails";
import CartDetails from "../pages/Carts/CartDetails";
import CartList from "../pages/Carts/CartList";
import RevenueDashboard from "../pages/Revenue/Revenue";
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
        path="unapproved-vendors"
        element={
          <PrivateRoute>
            <UnapprovedVendors />
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
      <Route
        path="products"
        element={
          <PrivateRoute>
            <ProductList />
          </PrivateRoute>
        }
      />
      <Route
        path="products/:id"
        element={
          <PrivateRoute>
            <ProductDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="orders"
        element={
          <PrivateRoute>
            <OrderList />
          </PrivateRoute>
        }
      />
      <Route
        path="orders/:id"
        element={
          <PrivateRoute>
            <OrderDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="vendor"
        element={
          <PrivateRoute>
            <VendorList />
          </PrivateRoute>
        }
      />
      <Route
        path="vendor/:id"
        element={
          <PrivateRoute>
            <VendorDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="inquiries"
        element={
          <PrivateRoute>
            <InquiriesList />
          </PrivateRoute>
        }
      />
      <Route
        path="inquiries/:id"
        element={
          <PrivateRoute>
            <InquiryDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="discounts"
        element={
          <PrivateRoute>
            <DiscountList />
          </PrivateRoute>
        }
      />
      <Route
        path="discounts/:id"
        element={
          <PrivateRoute>
            <DiscountDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="Subscribers"
        element={
          <PrivateRoute>
            <SubscriptionList />
          </PrivateRoute>
        }
      />
      <Route
        path="stockpiles"
        element={
          <PrivateRoute>
            <StockpilesList />
          </PrivateRoute>
        }
      />

      <Route
        path="stockpiles/:id"
        element={
          <PrivateRoute>
            <StockpileDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="pushnotifications"
        element={
          <PrivateRoute>
            <PushNotifs />
          </PrivateRoute>
        }
      />
      <Route
        path="feedbacks"
        element={
          <PrivateRoute>
            <FeedbackList />
          </PrivateRoute>
        }
      />
      <Route
        path="feedbacks/:id"
        element={
          <PrivateRoute>
            <FeedbackDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="newusers"
        element={
          <PrivateRoute>
            <UserList />
          </PrivateRoute>
        }
      />
      <Route
        path="newusers/:id"
        element={
          <PrivateRoute>
            <UserDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="carts"
        element={
          <PrivateRoute>
            <CartList />
          </PrivateRoute>
        }
      />
      <Route
        path="carts/:id"
        element={
          <PrivateRoute>
            <CartDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="revenue"
        element={
          <PrivateRoute>
            <RevenueDashboard />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<div>404: Not Found</div>} />
    </Routes>
  );
};

export default AdminRoutes;
