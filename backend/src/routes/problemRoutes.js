import express from "express";
import jwt from "jsonwebtoken";

import {
  createProblem,
  getAllProblems,
  getProblemBySlug,
  getProblemWithTestCases,
  updateProblem,
  deleteProblem,
} from "../controllers/problemController.js";

import {
  protect,
  restrictTo,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ── Public-ish routes (protect optional, just to detect admin role) ──
// We use a lightweight middleware below to attach req.user if a token exists,
// without blocking the request if it doesn't.

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
   
    try {
      const decoded = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_ACCESS_SECRET
      );
      req.user = decoded;
    } catch {
      // Invalid token — proceed as unauthenticated
    }
  }

  next();
};

router.get("/", optionalAuth, getAllProblems);
router.get("/:slug", optionalAuth, getProblemBySlug);

// ── Protected routes (admin / problemsetter only) ──
router.post("/", protect, restrictTo("admin", "problemsetter"), createProblem);
router.put("/:slug", protect, restrictTo("admin", "problemsetter"), updateProblem);
router.delete("/:slug", protect, restrictTo("admin"), deleteProblem);

// Full problem with test cases — for judge/internal use
router.get(
  "/:slug/full",
  protect,
  restrictTo("admin", "problemsetter"),
  getProblemWithTestCases
);

export default router;