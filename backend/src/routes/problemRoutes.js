import express from "express";
import {
  createProblem,
  getAllProblems,
  getProblemBySlug,
  getProblemWithTestCases,
  updateProblem,
  deleteProblem,
} from "../controllers/problemController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Attaches req.user if token exists but does NOT block if no token
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_ACCESS_SECRET
      );
      req.user = decoded;
    } catch {
      // invalid token — just proceed as guest
    }
  }
  next();
};

// Public — no login needed
router.get("/", getAllProblems);
router.get("/:slug", optionalAuth, getProblemBySlug);

// Admin/problemsetter only
router.post("/", protect, restrictTo("admin", "problemsetter"), createProblem);
router.put("/:slug", protect, restrictTo("admin", "problemsetter"), updateProblem);
router.delete("/:slug", protect, restrictTo("admin"), deleteProblem);
router.get("/:slug/full", protect, restrictTo("admin", "problemsetter"), getProblemWithTestCases);

export default router;