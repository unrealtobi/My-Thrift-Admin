import { useState, useEffect, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Create a context to hold the auth state
const AuthContext = createContext();

// Create a provider component for the auth context
export const AuthProvider = ({ children }) => {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const token = await user.getIdTokenResult();
        setUser(user);
        setIsAdmin(token.claims.admin || false);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
