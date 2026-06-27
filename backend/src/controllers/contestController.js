import Contest from "../models/Contest.js";
import ContestSubmission from "../models/ContestSubmission.js";
import Problem from "../models/Problem.js";
import { generateFile } from "../../compiler/generateFile.js";
import { generateInputFile } from "../../compiler/generateInputFile.js";
import { executeCode } from "../../compiler/executeCode.js";
import { cleanupFile, cleanupOutput, outputPath } from "../../compiler/cleanup.js";

// Helper — generate slug from title
const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

/**
 * @desc    Create contest
 * @route   POST /api/contests
 * @access  Private (admin)
 */
export const createContest = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      problems,
      scoringMode,
      isPublished,
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "title, startTime and endTime are required",
      });
    }

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: "endTime must be after startTime",
      });
    }

    // Generate unique slug
    let slug = generateSlug(title);
    let exists = await Contest.findOne({ slug });
    let counter = 1;
    while (exists) {
      slug = `${generateSlug(title)}-${counter++}`;
      exists = await Contest.findOne({ slug });
    }

    // Enrich problems with title and slug from DB
    let enrichedProblems = [];
    if (problems && problems.length > 0) {
      for (const p of problems) {
        const problem = await Problem.findById(p.problemId).select(
          "title slug"
        );
        if (problem) {
          enrichedProblems.push({
            problemId: p.problemId,
            problemSlug: problem.slug,
            problemTitle: problem.title,
            points: p.points || 100,
            order: p.order || enrichedProblems.length,
          });
        }
      }
    }

    const contest = await Contest.create({
      title: title.trim(),
      slug,
      description: description || "",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      problems: enrichedProblems,
      scoringMode: scoringMode || "ACM",
      isPublished: isPublished || false,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Contest created successfully",
      contest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all contests (with status filter)
 * @route   GET /api/contests?status=Live|Upcoming|Past
 * @access  Public
 */
export const getAllContests = async (req, res) => {
  try {
    const now = new Date();
    let filter = { isPublished: true };

    if (req.query.status === "Live") {
      filter.startTime = { $lte: now };
      filter.endTime = { $gte: now };
    } else if (req.query.status === "Upcoming") {
      filter.startTime = { $gt: now };
    } else if (req.query.status === "Past") {
      filter.endTime = { $lt: now };
    }

    const contests = await Contest.find(filter)
      .select("-problems.problemId")
      .sort({ startTime: -1 });

    // Add status virtual to each
    const withStatus = contests.map((c) => ({
      ...c.toJSON(),
      participantCount: c.registeredUsers.length,
    }));

    return res.status(200).json({ success: true, contests: withStatus });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single contest by slug
 * @route   GET /api/contests/:slug
 * @access  Public (problems hidden until contest starts unless admin)
 */
export const getContestBySlug = async (req, res) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const now = new Date();
    const contestData = contest.toJSON();

    // Hide problems if contest hasn't started and user is not admin
    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "problemsetter";
    const hasStarted = now >= contest.startTime;

    if (!hasStarted && !isAdmin) {
      contestData.problems = [];
    }

    // Check if current user is registered
    const isRegistered = req.user
      ? contest.registeredUsers.some(
          (id) => id.toString() === req.user.id
        )
      : false;

    return res.status(200).json({
      success: true,
      contest: {
        ...contestData,
        participantCount: contest.registeredUsers.length,
        isRegistered,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update contest
 * @route   PUT /api/contests/:slug
 * @access  Private (admin)
 */
export const updateContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const allowed = [
      "title", "description", "startTime", "endTime",
      "problems", "scoringMode", "isPublished",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        contest[field] = req.body[field];
      }
    });

    await contest.save();

    return res.status(200).json({
      success: true,
      message: "Contest updated",
      contest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete contest
 * @route   DELETE /api/contests/:slug
 * @access  Private (admin)
 */
export const deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findOneAndDelete({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contest deleted",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────

/**
 * @desc    Register for a contest
 * @route   POST /api/contests/:slug/register
 * @access  Private
 */
export const registerForContest = async (req, res) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    if (new Date() > contest.endTime) {
      return res.status(400).json({
        success: false,
        message: "Contest has already ended",
      });
    }

    const alreadyRegistered = contest.registeredUsers.some(
      (id) => id.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "Already registered for this contest",
      });
    }

    contest.registeredUsers.push(req.user.id);
    await contest.save();

    return res.status(200).json({
      success: true,
      message: "Registered successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Contest Submission
// ─────────────────────────────────────────────

/**
 * @desc    Submit code in a contest
 * @route   POST /api/contests/:slug/submit
 * @access  Private (must be registered)
 */
export const contestSubmit = async (req, res) => {
  try {
    const { problemSlug, language, code } = req.body;
    const contest = await Contest.findOne({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const now = new Date();

    // Contest must be live
    if (now < contest.startTime) {
      return res.status(400).json({
        success: false,
        message: "Contest has not started yet",
      });
    }

    if (now > contest.endTime) {
      return res.status(400).json({
        success: false,
        message: "Contest has ended",
      });
    }

    // Must be registered
    const isRegistered = contest.registeredUsers.some(
      (id) => id.toString() === req.user.id
    );

    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: "You must register for this contest before submitting",
      });
    }

    // Find problem in contest
    const contestProblem = contest.problems.find(
      (p) => p.problemSlug === problemSlug
    );

    if (!contestProblem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found in this contest",
      });
    }

    // Fetch problem with test cases
    const problem = await Problem.findOne({ slug: problemSlug }).select(
      "+testCases"
    );

    if (!problem || !problem.testCases?.length) {
      return res.status(400).json({
        success: false,
        message: "No test cases found",
      });
    }

    // Check if already solved this problem in this contest
    const alreadySolved = await ContestSubmission.findOne({
      contestId: contest._id,
      userId: req.user.id,
      problemId: problem._id,
      verdict: "Accepted",
    });

    if (alreadySolved) {
      return res.status(400).json({
        success: false,
        message: "You have already solved this problem",
      });
    }

    // Count previous wrong answers for penalty (ACM mode)
    const wrongAnswers = await ContestSubmission.countDocuments({
      contestId: contest._id,
      userId: req.user.id,
      problemId: problem._id,
      verdict: { $in: ["Wrong Answer", "Time Limit Exceeded", "Runtime Error"] },
    });

    // Create pending submission
    const submission = await ContestSubmission.create({
      contestId: contest._id,
      userId: req.user.id,
      problemId: problem._id,
      problemSlug,
      language,
      code,
      verdict: "Pending",
      totalTestCases: problem.testCases.length,
    });

    let filePath, jobId, jobDir;

    try {
      ({ filePath, jobId, jobDir } = await generateFile(language, code));

      let testCasesPassed = 0;
      let finalVerdict = "Accepted";
      let errorMessage = "";
      let maxRuntime = 0;

      for (let i = 0; i < problem.testCases.length; i++) {
        const testCase = problem.testCases[i];
        let inputFilePath;

        try {
          inputFilePath = await generateInputFile(testCase.input);

          const startTime = Date.now();
          const result = await executeCode(
            language, filePath, inputFilePath, jobId, jobDir
          );
          const runtime = Date.now() - startTime;
          if (runtime > maxRuntime) maxRuntime = runtime;

          if (!result.success) {
            if (result.errorType === "compile_error") {
              finalVerdict = "Compile Error";
              errorMessage = result.error;
              break;
            } else if (result.errorType === "timeout") {
              finalVerdict = "Time Limit Exceeded";
              break;
            } else {
              finalVerdict = "Runtime Error";
              errorMessage = result.error;
              break;
            }
          }

          if (result.output.trim() !== testCase.expectedOutput.trim()) {
            finalVerdict = "Wrong Answer";
            errorMessage = `Test case ${i + 1} failed.\nExpected: ${testCase.expectedOutput.trim()}\nGot: ${result.output.trim()}`;
            break;
          }

          testCasesPassed++;
        } finally {
          if (inputFilePath) cleanupFile(inputFilePath);
        }
      }

      // Calculate points and penalty
      let pointsEarned = 0;
      let penaltyMinutes = 0;
      let solveTimeMinutes = 0;

      if (finalVerdict === "Accepted") {
        pointsEarned = contestProblem.points;

        // ACM penalty: 20 min per wrong answer before acceptance
        if (contest.scoringMode === "ACM") {
          penaltyMinutes = wrongAnswers * 20;
          solveTimeMinutes = Math.floor(
            (now - contest.startTime) / 1000 / 60
          );
        }
      }

      // Update submission
      submission.verdict = finalVerdict;
      submission.testCasesPassed = testCasesPassed;
      submission.runtime = maxRuntime;
      submission.errorMessage = errorMessage;
      submission.pointsEarned = pointsEarned;
      submission.penaltyMinutes = penaltyMinutes;
      submission.solveTimeMinutes = solveTimeMinutes;
      await submission.save();

      return res.status(200).json({
        success: true,
        submission: {
          _id: submission._id,
          verdict: finalVerdict,
          testCasesPassed,
          totalTestCases: problem.testCases.length,
          runtime: maxRuntime,
          errorMessage,
          pointsEarned,
          language,
          createdAt: submission.createdAt,
        },
      });
    } catch (error) {
      submission.verdict = "Runtime Error";
      submission.errorMessage = error.message;
      await submission.save();

      return res.status(500).json({
        success: false,
        message: "Submission failed",
        error: error.message,
      });
    } finally {
      if (language === "java" && jobDir) {
        cleanupFile(jobDir);
      } else if (filePath) {
        cleanupFile(filePath);
        if (jobId) cleanupOutput(language, jobId, jobDir);
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// Scoreboard
// ─────────────────────────────────────────────

/**
 * @desc    Get live scoreboard for a contest
 * @route   GET /api/contests/:slug/scoreboard
 * @access  Public
 */
export const getScoreboard = async (req, res) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    // Get all accepted submissions for this contest
    const accepted = await ContestSubmission.find({
      contestId: contest._id,
      verdict: "Accepted",
    }).populate("userId", "firstName lastName email");

    // Get all wrong submissions for penalty count
    const wrong = await ContestSubmission.find({
      contestId: contest._id,
      verdict: { $in: ["Wrong Answer", "Time Limit Exceeded", "Runtime Error"] },
    });

    // Build scoreboard map: userId -> { user, problems solved, total score, penalty }
    const scoreMap = {};

    // Count wrong answers per user per problem
    const wrongMap = {};
    wrong.forEach((s) => {
      const key = `${s.userId}_${s.problemId}`;
      wrongMap[key] = (wrongMap[key] || 0) + 1;
    });

    accepted.forEach((s) => {
      const uid = s.userId._id.toString();

      if (!scoreMap[uid]) {
        scoreMap[uid] = {
          userId: uid,
          firstName: s.userId.firstName,
          lastName: s.userId.lastName,
          totalPoints: 0,
          totalPenalty: 0,
          solvedProblems: {},
        };
      }

      const entry = scoreMap[uid];
      const pid = s.problemId.toString();

      // Only count first accepted per problem
      if (!entry.solvedProblems[pid]) {
        const wrongKey = `${uid}_${pid}`;
        const wrongCount = wrongMap[wrongKey] || 0;
        const penalty =
          contest.scoringMode === "ACM"
            ? s.solveTimeMinutes + wrongCount * 20
            : 0;

        entry.solvedProblems[pid] = {
          points: s.pointsEarned,
          solveTime: s.solveTimeMinutes,
          wrongAttempts: wrongCount,
          penalty,
        };

        entry.totalPoints += s.pointsEarned;
        entry.totalPenalty += penalty;
      }
    });

    // Sort: most points first, then least penalty
    const sorted = Object.values(scoreMap).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.totalPenalty - b.totalPenalty;
    });

    const ranked = sorted.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
      solvedCount: Object.keys(entry.solvedProblems).length,
    }));

    return res.status(200).json({
      success: true,
      scoreboard: ranked,
      contest: {
        title: contest.title,
        status: contest.status,
        startTime: contest.startTime,
        endTime: contest.endTime,
        problems: contest.problems,
        scoringMode: contest.scoringMode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get my submissions in a contest
 * @route   GET /api/contests/:slug/my-submissions
 * @access  Private
 */
export const getMyContestSubmissions = async (req, res) => {
  try {
    const contest = await Contest.findOne({ slug: req.params.slug });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const submissions = await ContestSubmission.find({
      contestId: contest._id,
      userId: req.user.id,
    })
      .select("-code")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};