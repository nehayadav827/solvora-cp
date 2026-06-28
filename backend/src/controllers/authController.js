import jwt from "jsonwebtoken";
import User from "../models/User.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

const cookieOptions = {
  httpOnly: true,   // JS cannot read this cookie — XSS protection
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",        // cookie sent on all routes
};

//register controller

export const register  = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
    } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    const accessToken =
      generateAccessToken(user._id);

    const refreshToken =
      generateRefreshToken(user._id);

    user.refreshToken = refreshToken;

    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions
    );

  res.status(201).json({
  success: true,
  accessToken,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  },
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch =
      await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken =
      generateAccessToken(user._id);

    const refreshToken =
      generateRefreshToken(user._id);

    user.refreshToken = refreshToken;

    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions
    );

    res.status(200).json({
  success: true,
  accessToken,
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  },
});

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

  //Logout Controller
  export const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    const user = await User.findOne({
      refreshToken: token,
    });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logged out",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getMe Controller
export const getMe = async (req, res) => {
  try {
   const user = await User.findById(req.user.id)
  .select("-password -refreshToken");

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Refresh Controller
export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(decoded.id);

    if (
      !user ||
      user.refreshToken !== token
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Refresh token mismatch, please login again",
      });
    }

    const accessToken =
      generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
