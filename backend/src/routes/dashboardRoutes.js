import express from "express";
import { getMyDashboard, getLeaderboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyDashboard);
router.get("/leaderboard", getLeaderboard); // public

export default router;