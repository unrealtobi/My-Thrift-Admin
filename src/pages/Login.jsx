import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import logo from "../Images/logo.png";
import toast, { Toaster } from "react-hot-toast"; // Importing toast for notifications
import { RotatingLines } from "react-loader-spinner"; // Importing the rotating lines loader

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    toast.dismiss(); // Dismiss any existing toasts

    try {
      // Sign in the admin user with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check if the user has the admin role
      const token = await user.getIdTokenResult();

      if (token.claims.admin) {
        // Redirect to the admin dashboard
        navigate("/dashboard");
        toast.success("Successfully logged in!");
      } else {
        setError("You do not have admin privileges.");
        toast.error("You do not have admin privileges.");
        await auth.signOut(); // Log out the user if they are not an admin
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message); // Show error toast for any issues during login
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Toast Container */}
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={logo} alt="logo" className="w-24 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-700 mt-4">Admin Login</h2>
          <p className="text-gray-500">Sign in and start managing my thrift!</p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <div className="mb-4">
          <input
            type="email"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-customOrange"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-customOrange"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 bg-customOrange text-white rounded-lg font-semibold hover:bg-customOrange transition flex justify-center items-center"
        >
          {loading ? (
            <RotatingLines
              strokeColor="white"
              strokeWidth="5"
              animationDuration="0.75"
              width="24"
              visible={true}
            />
          ) : (
            "Login"
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
