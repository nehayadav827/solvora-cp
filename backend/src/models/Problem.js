import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },
    output: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
    },
    expectedOutput: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    // URL-friendly version of title — e.g. "two-sum"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    statement: {
      type: String,
      required: [true, "Problem statement is required"],
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    // Shown to users on the problem page
    examples: {
      type: [exampleSchema],
      default: [],
    },

    // Hidden — used only by the judge, never sent to frontend
    testCases: {
      type: [testCaseSchema],
      default: [],
      select: false,
    },

    constraints: {
      type: String,
      default: "",
    },

    timeLimit: {
      type: Number,
      default: 1,
    },

    memoryLimit: {
      type: Number,
      default: 256,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
problemSchema.index({ difficulty: 1, isPublished: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ title: "text" });

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;