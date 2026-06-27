import Submission from "../models/Submission.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";

/**
 * @desc    Get logged-in user's dashboard stats
 * @route   GET /api/dashboard/me
 * @access  Private
 */
export const getMyDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // All submissions by this user
    const allSubmissions = await Submission.find({ userId }).sort({ createdAt: -1 });

    // Unique problems solved (at least one Accepted)
    const acceptedSubmissions = allSubmissions.filter(
      (s) => s.verdict === "Accepted"
    );
    const solvedSlugs = [...new Set(acceptedSubmissions.map((s) => s.problemSlug))];

    // Submissions per verdict count
    const verdictCount = {
      Accepted: 0,
      "Wrong Answer": 0,
      "Time Limit Exceeded": 0,
      "Runtime Error": 0,
      "Compile Error": 0,
    };
    allSubmissions.forEach((s) => {
      if (verdictCount[s.verdict] !== undefined) {
        verdictCount[s.verdict]++;
      }
    });

    // Difficulty breakdown of solved problems
    const solvedProblems = await Problem.find({ slug: { $in: solvedSlugs } }).select(
      "title slug difficulty tags"
    );

    const difficultyBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
    solvedProblems.forEach((p) => {
      if (difficultyBreakdown[p.difficulty] !== undefined) {
        difficultyBreakdown[p.difficulty]++;
      }
    });

    // Language usage breakdown
    const languageCount = {};
    allSubmissions.forEach((s) => {
      languageCount[s.language] = (languageCount[s.language] || 0) + 1;
    });

    // Recent 5 submissions with problem info
    const recentSubmissions = allSubmissions.slice(0, 5);

    // Submission activity — last 30 days (for heatmap)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Submission.aggregate([
      {
        $match: {
          userId: { $eq: (await import("mongoose")).default.Types.ObjectId.createFromHexString(userId) },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        totalSubmissions: allSubmissions.length,
        totalSolved: solvedSlugs.length,
        verdictCount,
        difficultyBreakdown,
        languageCount,
        recentSubmissions,
        solvedProblems,
        recentActivity,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get global leaderboard — ranked by problems solved then total submissions
 * @route   GET /api/dashboard/leaderboard
 * @access  Public
 */
export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Aggregate: for each user find unique solved problems
    const leaderboard = await Submission.aggregate([
      { $match: { verdict: "Accepted" } },

      // Group by userId + problemSlug to get unique solves per user
      {
        $group: {
          _id: { userId: "$userId", problemSlug: "$problemSlug" },
        },
      },

      // Now group by userId to count unique solved problems
      {
        $group: {
          _id: "$_id.userId",
          totalSolved: { $sum: 1 },
        },
      },

      { $sort: { totalSolved: -1 } },
      { $limit: limit },

      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // Only return safe fields
      {
        $project: {
          _id: 0,
          userId: "$_id",
          totalSolved: 1,
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
        },
      },
    ]);

    // Add rank
    const ranked = leaderboard.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    return res.status(200).json({
      success: true,
      leaderboard: ranked,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};