import mongoose from "mongoose";

const contestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },

    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },

    problems: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
          required: true,
        },
        problemSlug: String,
        problemTitle: String,
        points: {
          type: Number,
          default: 100,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    registeredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ACM = penalty time based, IOI = partial scoring
    scoringMode: {
      type: String,
      enum: ["ACM", "IOI"],
      default: "ACM",
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

// Virtual — compute status on the fly
contestSchema.virtual("status").get(function () {
  const now = new Date();
  if (now < this.startTime) return "Upcoming";
  if (now > this.endTime) return "Past";
  return "Live";
});

contestSchema.set("toJSON", { virtuals: true });
contestSchema.set("toObject", { virtuals: true });

export default mongoose.model("Contest", contestSchema);