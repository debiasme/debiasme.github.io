import axios from "axios";
import { prompts } from "../prompts.js";
import { checkDNSConnection, getHostname } from "../utils/dnsUtils.js";
import { cleanBiasType } from "../utils/cleanBiasType.js";
import { AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT } from "../config.js";
import { callAzureOpenAI } from "../utils/azureApi.js";

const API_VERSION = "2024-12-01-preview";

const axiosInstance = axios.create({
  timeout: 30000,
  maxRetries: 2,
  retryDelay: 500,
  headers: {
    "Content-Type": "application/json",
    "api-key": AZURE_API_KEY,
  },
});

axiosInstance.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) return Promise.reject(err);
  if (!err.isAxiosError || (err.response && err.response.status < 500))
    return Promise.reject(err);
  config.currentRetryAttempt = config.currentRetryAttempt || 0;
  if (config.currentRetryAttempt >= config.retry) return Promise.reject(err);
  config.currentRetryAttempt += 1;
  await new Promise((resolve) => setTimeout(resolve, config.retryDelay || 500));
  return axiosInstance(config);
});

export async function processMessage(req, res) {
  try {
    const userInput = req.body.input;
    const biasCheckerEnabled = req.body.biasCheckerEnabled;

    if (!biasCheckerEnabled) {
      const aiContent = await callAzureOpenAI(
        [{ role: "user", content: userInput }],
        { max_tokens: 800, temperature: 0.7 }
      );
      return res.json({
        success: true,
        response: aiContent,
        biases: [],
      });
    }

    // Bias checker enabled
    const aiResponse = await callAzureOpenAI(
      [
        { role: "system", content: prompts.chatGeneration },
        { role: "user", content: userInput },
      ],
      { max_tokens: 800, temperature: 0.7 }
    );

    const biasContent = await callAzureOpenAI(
      [
        { role: "system", content: prompts.biasAnalysis },
        { role: "user", content: aiResponse },
      ],
      { max_tokens: 800, temperature: 0.7 }
    );

    let biases = [];
    try {
      const biasAnalysis = JSON.parse(biasContent);
      biases = biasAnalysis.biases.map((bias) => ({
        ...bias,
        type: cleanBiasType(bias.type),
      }));
    } catch {
      // ignore parse error, return empty biases
    }

    return res.json({
      success: true,
      response: aiResponse,
      biases: biases,
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        error: { message: "Request timed out. Please try again." },
      });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: {
          message: "Rate limit exceeded. Please try again in a few seconds.",
        },
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
}
