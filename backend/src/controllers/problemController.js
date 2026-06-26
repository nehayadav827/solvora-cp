import Problem from "../models/Problem.js";

// Helper — converts "Two Sum" → "two-sum"
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-")          // spaces to hyphens
    .replace(/-+/g, "-");          // collapse multiple hyphens
};

/**
 * @desc    Create a new problem
 * @route   POST /api/problems
 * @access  Private (admin, problemsetter)
 */
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      statement,
      difficulty,
      tags,
      examples,
      testCases,
      constraints,
      timeLimit,
      memoryLimit,
      isPublished,
    } = req.body;

    // ── Validation ──
    if (!title || !statement || !difficulty) {
      return res.status(400).json({
        success: false,
        message: "Title, statement, and difficulty are required",
      });
    }

    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Difficulty must be Easy, Medium, or Hard",
      });
    }

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one test case is required",
      });
    }

    // Validate test case structure
    for (const tc of testCases) {
      if (tc.input === undefined || tc.expectedOutput === undefined) {
        return res.status(400).json({
          success: false,
          message: "Each test case must have 'input' and 'expectedOutput'",
        });
      }
    }

    // ── Generate unique slug ──
    let slug = generateSlug(title);
    let slugExists = await Problem.findOne({ slug });
    let counter = 1;

    // If slug already exists, append a number: "two-sum-2"
    while (slugExists) {
      slug = `${generateSlug(title)}-${counter}`;
      slugExists = await Problem.findOne({ slug });
      counter++;
    }

    const problem = await Problem.create({
      title: title.trim(),
      slug,
      statement,
      difficulty,
      tags: tags || [],
      examples: examples || [],
      testCases,
      constraints: constraints || "",
      timeLimit: timeLimit || 1,
      memoryLimit: memoryLimit || 256,
      isPublished: isPublished || false,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      problem: {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        tags: problem.tags,
        isPublished: problem.isPublished,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A problem with this slug already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all problems (paginated, filterable)
 * @route   GET /api/problems?page=1&limit=20&difficulty=Easy&tag=DP&search=sum
 * @access  Public (only published) / Private admins see all
 */
export const getAllProblems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Non-admins only see published problems
    // req.user may be undefined if route is public — handle both cases
    const isAdmin = req.user?.role === "admin" || req.user?.role === "problemsetter";
    if (!isAdmin) {
      filter.isPublished = true;
    }

    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: "i" };
    }

    const problems = await Problem.find(filter)
      .select("title slug difficulty tags isPublished createdAt") // lightweight fields only
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Problem.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: problems.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single problem by slug (test cases excluded)
 * @route   GET /api/problems/:slug
 * @access  Public (published only) / Private admins see unpublished too
 */
export const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    // testCases automatically excluded due to select:false in schema

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    // If unpublished, only admins/problemsetters can view it
    const isAdmin = req.user?.role === "admin" || req.user?.role === "problemsetter";
    if (!problem.isPublished && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get a single problem WITH test cases — for internal judge use only
 * @route   GET /api/problems/:slug/full
 * @access  Private (admin, problemsetter) — or called internally by submission service
 */
export const getProblemWithTestCases = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).select("+testCases");

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    res.status(200).json({
      success: true,
      problem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update a problem
 * @route   PUT /api/problems/:slug
 * @access  Private (admin, problemsetter)
 */
export const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug }).select("+testCases");

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    const allowedFields = [
      "title",
      "statement",
      "difficulty",
      "tags",
      "examples",
      "testCases",
      "constraints",
      "timeLimit",
      "memoryLimit",
      "isPublished",
    ];

    // Only update fields that were actually sent
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        problem[field] = req.body[field];
      }
    });

    // If title changed, regenerate slug
    if (req.body.title && req.body.title.trim() !== problem.title) {
      let newSlug = generateSlug(req.body.title);
      let slugExists = await Problem.findOne({ slug: newSlug, _id: { $ne: problem._id } });
      let counter = 1;

      while (slugExists) {
        newSlug = `${generateSlug(req.body.title)}-${counter}`;
        slugExists = await Problem.findOne({ slug: newSlug, _id: { $ne: problem._id } });
        counter++;
      }

      problem.slug = newSlug;
      problem.title = req.body.title.trim();
    }

    await problem.save();

    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      problem: {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        isPublished: problem.isPublished,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete a problem
 * @route   DELETE /api/problems/:slug
 * @access  Private (admin only)
 */
export const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ slug: req.params.slug });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};