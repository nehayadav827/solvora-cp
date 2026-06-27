import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await loginUser(formData);
      setAuth(res.data.user, res.data.accessToken);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Sign in to your CodeArena account</p>
        {error && <p className="error" style={{ marginBottom: 16 }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email" name="email" placeholder="Email address"
            value={formData.email} onChange={handleChange} required
          />
          <input
            type="password" name="password" placeholder="Password"
            value={formData.password} onChange={handleChange} required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;