import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) return <p style={{ padding: 32 }}>Loading...</p>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;