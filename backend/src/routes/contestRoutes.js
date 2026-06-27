import express from "express";
import {
  createContest,
  getAllContests,
  getContestBySlug,
  updateContest,
  deleteContest,
  registerForContest,
  contestSubmit,
  getScoreboard,
  getMyContestSubmissions,
} from "../controllers/contestController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Optional auth — attach user if token exists but don't block
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(
        authHeader.split(" ")[1],
        process.env.JWT_ACCESS_SECRET
      );
    } catch {}
  }
  next();
};

// Public
router.get("/", getAllContests);
router.get("/:slug", optionalAuth, getContestBySlug);
router.get("/:slug/scoreboard", getScoreboard);

// Private
router.post("/", protect, restrictTo("admin", "problemsetter"), createContest);
router.put("/:slug", protect, restrictTo("admin", "problemsetter"), updateContest);
router.delete("/:slug", protect, restrictTo("admin"), deleteContest);
router.post("/:slug/register", protect, registerForContest);
router.post("/:slug/submit", protect, contestSubmit);
router.get("/:slug/my-submissions", protect, getMyContestSubmissions);

export default router;