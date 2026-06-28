import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import compilerRoutes from "../compiler/compilerRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import contestRoutes from "./routes/contestRoutes.js";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Vite in dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5173"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for Monaco editor
}));

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/compiler", compilerRoutes);
app.use("/api/problems", problemRoutes); 
app.use("/api/submissions", submissionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/contests", contestRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Online Judge API Running",
  });
});

export default app;