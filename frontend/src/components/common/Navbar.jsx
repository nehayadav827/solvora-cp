import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logoutUser } from "../../api/authApi";

const Navbar = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logoutUser();
    clearAuth();
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path))
      ? "active" : "";

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">CodeArena</Link>

      <div className="navbar-links">
        <Link to="/problems" className={isActive("/problems")}>Problems</Link>
        <Link to="/leaderboard" className={isActive("/leaderboard")}>Leaderboard</Link>
        {user && (
          <>
            <Link to="/compiler" className={isActive("/compiler")}>Compiler</Link>
            <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
          </>
        )}
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/dashboard" className="navbar-user">
              <div className="navbar-avatar">{initials}</div>
              {user.firstName}
            </Link>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-login">Sign in</Link>
            <Link to="/register" className="navbar-register">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;