import dotenv from "dotenv";
dotenv.config();

export const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
export const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
export const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT_NAME;
