import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "./firebase"; // Your Firebase setup

const AdminPanel = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin) {
          setIsAdmin(true); // Allow access to admin panel
        } else {
          // Redirect or block access for non-admins
          setIsAdmin(false);
        }
      } else {
        // No user logged in
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAdmin) {
    return <div>Access denied. Admins only.</div>;
  }

  return <div>Welcome to the Admin Panel</div>;
};

export default AdminPanel;
