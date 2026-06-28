import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dirInputs = path.join(__dirname, "inputs");

if (!fs.existsSync(dirInputs)) {
  fs.mkdirSync(dirInputs, { recursive: true });
}

export const generateInputFile = async (input) => {
  const jobId = uuid();
  const inputFilePath = path.join(dirInputs, `${jobId}.txt`);

   // Always write something valid — empty string if no input
  // This prevents stdin from hanging when no input is provided
  const safeInput = (input === undefined || input === null)
    ? ""
    : String(input);
    
  // Always write something — empty string if no input given
  fs.writeFileSync(inputFilePath, input ?? "");

  return inputFilePath;
};