import express from "express";
import { runCode } from "./compilerController.js";
import { validateSubmission } from "../src/middleware/validateRequest.js";

const router = express.Router();

router.post("/run", runCode);
router.post("/run", validateSubmission, runCode);

export default router;