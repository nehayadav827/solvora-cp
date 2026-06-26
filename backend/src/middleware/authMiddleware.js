import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (
  req,
  res,
  next
) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith(
        "Bearer"
      )
    ) {
      token =
        req.headers.authorization.split(
          " "
        )[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Restricts access to specific roles
// Usage:
// router.post("/", protect, restrictTo("admin", "problemsetter"), createProblem)

export const restrictTo = (...roles) => {
  return async (req, res, next) => {
    try {
      // req.user only has { id } from the JWT
      // Fetch the full user to check their role
      const user = await User.findById(req.user.id);

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
        });
      }

      // Attach role so controllers can use it
      req.user.role = user.role;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization check failed",
      });
       }
  };
};