import mongoose from "mongoose";

const contestSubmissionSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },

    problemSlug: String,

    language: {
      type: String,
      enum: ["cpp", "java", "python", "javascript"],
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    verdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compile Error",
        "Pending",
      ],
      default: "Pending",
    },

    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },

    // Points earned for this submission
    pointsEarned: { type: Number, default: 0 },

    // Penalty time in minutes (ACM mode — 20 min per wrong answer)
    penaltyMinutes: { type: Number, default: 0 },

    // Time in minutes from contest start when accepted
    solveTimeMinutes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ContestSubmission", contestSubmissionSchema);