import axios from "axios";
import { AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT } from "../config.js";

const API_VERSION = "2025-01-01-preview";

export async function callAzureOpenAI(messages, options = {}) {
  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`;
  const response = await axios.post(
    url,
    {
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 800,
      ...options.extra,
    },
    {
      params: { "api-version": API_VERSION },
      headers: {
        "api-key": AZURE_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: options.timeout ?? 30000,
    }
  );
  return response.data.choices[0].message.content;
}
