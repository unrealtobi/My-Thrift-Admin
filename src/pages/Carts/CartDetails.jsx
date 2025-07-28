import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { FaChevronLeft } from "react-icons/fa";

export default function CartDetails() {
  const { id } = useParams(); // cart ID
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [userName, setUserName] = useState("Guest");
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartRef = doc(db, "carts", id);
        const cartSnap = await getDoc(cartRef);

        if (cartSnap.exists()) {
          const cartData = cartSnap.data();
          setCart({ id: cartSnap.id, ...cartData });

          if (cartData.userId) {
            const userRef = doc(db, "users", cartData.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              setUserName(userData.displayName || "Unnamed User");
              setUserDetails(userData);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching cart details:", error);
      }

      setLoading(false);
    };

    fetchCart();
  }, [id]);

  if (loading || !cart) return <div className="p-6">Loading...</div>;

  const products = Object.values(cart.products || {});

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-customOrange text-white px-4 py-2 rounded-lg flex items-center mb-4"
      >
        <FaChevronLeft className="mr-2" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-customOrange mb-6">
        Cart Details
      </h1>

      <div className="bg-white p-6 shadow rounded mb-6">
        <h2 className="text-xl font-semibold text-customOrange mb-3">
          User Info
        </h2>
        <p>
          <strong>User:</strong>{" "}
          {cart.userId ? (
            <button
              onClick={() => navigate(`/dashboard/newusers/${cart.userId}`)}
              className="text-blue-600 hover:underline"
            >
              {userName}
            </button>
          ) : (
            userName
          )}
        </p>
        <p>
          <strong>User ID:</strong> {cart.userId || "Guest"}
        </p>
        {userDetails && (
          <>
            <p>
              <strong>Email:</strong> {userDetails.email || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {userDetails.phone || "N/A"}
            </p>
          </>
        )}
        <p>
          <strong>Items in Cart:</strong> {products.length}
        </p>
      </div>

      <div className="bg-white p-6 shadow rounded">
        <h2 className="text-xl font-semibold text-customOrange mb-4">
          Products in Cart
        </h2>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Size</th>
              <th className="p-3">Color</th>
              <th className="p-3">Price</th>
              <th className="p-3">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <img
                    src={p.selectedImageUrl || p.coverImageUrl}
                    alt={p.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.selectedSize}</td>
                <td className="p-3">{p.selectedColor}</td>
                <td className="p-3">₦{p.price}</td>
                <td className="p-3">{p.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
