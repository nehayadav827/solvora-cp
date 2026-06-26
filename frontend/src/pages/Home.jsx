import { useAuthStore } from "../store/authStore";
import { logoutUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Home = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    clearAuth();
    navigate("/login");
  };

 return (
  <div>
    <h1>Welcome, {user?.firstName}!</h1>

    <p>Email: {user?.email}</p>

    <p>Role: {user?.role}</p>

    <button onClick={handleLogout}>Logout</button>

    <div
      style={{
        display: "flex",
        gap: "16px",
        marginTop: "16px",
      }}
    >
      <Link to="/problems">Browse Problems</Link>

      <Link to="/compiler">Compiler</Link>
    </div>
  </div>
);
};

export default Home;