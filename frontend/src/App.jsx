import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Compiler from "./pages/Compiler";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public — no login needed */}
      <Route path="/problems" element={<Problems />} />
      <Route path="/problems/:slug" element={<ProblemDetail />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/compiler" element={<ProtectedRoute><Compiler /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;