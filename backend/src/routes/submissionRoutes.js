import express from "express";
import rateLimit from "express-rate-limit";
import {
  submitCode,
  getMySubmissions,
  getSubmissionById,
} from "../controllers/submissionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateSubmission } from "../middleware/validateRequest.js";

const submissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  // Fix: use user ID only, no IP fallback — avoids IPv6 issue
  keyGenerator: (req) => req.user?.id ?? "anonymous",
  skip: (req) => !req.user, // don't rate limit unauthenticated (protect handles that)
  message: {
    success: false,
    message: "Too many submissions. Please wait before submitting again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

router.post("/", protect, submissionLimiter, submitCode);
router.get("/", protect, getMySubmissions);
router.get("/:id", protect, getSubmissionById);
router.post("/", protect, submissionLimiter, validateSubmission, submitCode);

export default router;