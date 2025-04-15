import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, ".env") });

export const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
export const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
export const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT_NAME;
