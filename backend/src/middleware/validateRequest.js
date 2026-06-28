// Max code size — 50KB
const MAX_CODE_SIZE = 50 * 1024;

// Dangerous patterns to block BEFORE Docker even starts
// These are server-level checks — Docker handles the rest
const DANGEROUS_PATTERNS = [
  // Shell injection attempts in code metadata (not code content)
  /`[^`]*`/,          // backtick command substitution
  /\$\([^)]*\)/,      // $() command substitution
];

// Dangerous imports/commands that should never appear
// (Docker blocks these at runtime too, but catch early)
const BLOCKED_CODE_PATTERNS = {
  python: [
    /import\s+os.*system/,
    /subprocess\..*shell\s*=\s*True/,
    /__import__\s*\(\s*['"]os['"]\s*\)\s*\.system/,
  ],
  javascript: [
    /require\s*\(\s*['"]child_process['"]\s*\)/,
    /process\.exit/,
  ],
  cpp: [],
  java: [],
};

export const validateSubmission = (req, res, next) => {
  const { code, language, input } = req.body;

  // Code must exist
  if (!code || typeof code !== "string") {
    return res.status(400).json({
      success: false,
      message: "Code is required",
    });
  }

  // Code size limit
  if (Buffer.byteLength(code, "utf8") > MAX_CODE_SIZE) {
    return res.status(400).json({
      success: false,
      message: "Code exceeds maximum size of 50KB",
    });
  }

  // Language must be valid
  const ALLOWED_LANGUAGES = ["cpp", "java", "python", "javascript"];
  if (!language || !ALLOWED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      success: false,
      message: `Language must be one of: ${ALLOWED_LANGUAGES.join(", ")}`,
    });
  }

  // Input size limit — 10KB
  if (input && Buffer.byteLength(String(input), "utf8") > 10 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Input exceeds maximum size of 10KB",
    });
  }

  // Check for blocked patterns per language
  const blocked = BLOCKED_CODE_PATTERNS[language] || [];
  for (const pattern of blocked) {
    if (pattern.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Code contains restricted patterns",
      });
    }
  }

  next();
};

export const validateProblem = (req, res, next) => {
  const { title, statement, difficulty, testCases } = req.body;

  if (title && typeof title !== "string") {
    return res.status(400).json({ success: false, message: "Invalid title" });
  }

  if (title && title.length > 200) {
    return res.status(400).json({
      success: false,
      message: "Title too long (max 200 chars)",
    });
  }

  if (difficulty && !["Easy", "Medium", "Hard"].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: "Difficulty must be Easy, Medium, or Hard",
    });
  }

  if (testCases && !Array.isArray(testCases)) {
    return res.status(400).json({
      success: false,
      message: "testCases must be an array",
    });
  }

  next();
};