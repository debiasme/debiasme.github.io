import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import axios from "axios";
import dns from "dns";
import { prompts } from "./js/prompts.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
const isDev = process.env.NODE_ENV !== "production";
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
  "https://cmlmanni.github.io",
  "https://cmlmanni.github.io/AyeEye", // Add your GitHub Pages URL
  "https://debiasme.github.io",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || isDev) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);
app.use(express.json());

// Azure OpenAI API configuration
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT_NAME;
const API_VERSION = "2024-08-01-preview"; // DO NOT MODIFY THIS LINE

// Configure axios with optimized settings for direct messages
const axiosInstance = axios.create({
  timeout: 30000, // Reduce to 30 seconds for direct messages
  maxRetries: 2, // Reduce retries for direct messages
  retryDelay: 500, // Faster retry
  headers: {
    "Content-Type": "application/json",
    "api-key": AZURE_API_KEY,
  },
});

// Optimize retry logic
axiosInstance.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  // Only retry on network errors or 5xx responses
  if (!err.isAxiosError || (err.response && err.response.status < 500)) {
    return Promise.reject(err);
  }

  config.currentRetryAttempt = config.currentRetryAttempt || 0;
  if (config.currentRetryAttempt >= config.retry) {
    return Promise.reject(err);
  }

  config.currentRetryAttempt += 1;
  await new Promise((resolve) => setTimeout(resolve, config.retryDelay || 500));
  return axiosInstance(config);
});

// DNS resolution check
async function checkDNSConnection(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolve(hostname, (err, addresses) => {
      if (err) {
        console.error("DNS Resolution Error:", err);
        reject(err);
      } else {
        console.log("DNS Resolution Successful:", addresses);
        resolve(addresses);
      }
    });
  });
}

// Extract hostname from URL
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    return null;
  }
}

// Update the chat generation prompt to be more specific
const systemPrompt = prompts.chatGeneration;

// Use the same analysis prompt as BiasChecker
const biasAnalysisPrompt = prompts.biasAnalysis;

// Add this helper function at the top of the file
function cleanBiasType(type) {
  // Remove duplicate "Bias" and clean up spacing
  return type
    .replace(/\s*Bias\s*Bias$/i, " Bias") // Remove duplicate at end
    .replace(/^Bias\s*Bias\s*/i, "Bias ") // Remove duplicate at start
    .replace(/\s+/g, " ") // Clean up extra spaces
    .trim();
}

app.post("/api/process", async (req, res) => {
  console.log("\n=== New Message Processing ===");
  console.log("1. User Input:", req.body.input);
  console.log("2. Bias Checker Enabled:", req.body.biasCheckerEnabled);

  try {
    const userInput = req.body.input;
    const biasCheckerEnabled = req.body.biasCheckerEnabled;

    // If bias checker is disabled, send direct response without system prompt
    if (!biasCheckerEnabled) {
      console.log("Bias checker disabled - sending direct response");
      const response = await axiosInstance.post(
        `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`,
        {
          messages: [
            { role: "user", content: userInput }, // Send only user input without system prompt
          ],
          max_tokens: 800,
          temperature: 0.7,
          stream: false,
        },
        {
          params: { "api-version": API_VERSION },
          headers: {
            "api-key": AZURE_API_KEY,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      return res.json({
        success: true,
        response: response.data.choices[0].message.content,
        biases: [], // No bias analysis when disabled
      });
    }

    // If enabled, continue with existing bias checking logic
    console.log("3. System Prompt:", systemPrompt);

    const hostname = getHostname(AZURE_ENDPOINT);
    if (hostname) {
      await checkDNSConnection(hostname);
    }

    // First get AI response
    console.log("4. Getting AI response...");
    const response = await axiosInstance.post(
      `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`,
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: req.body.input },
        ],
        max_tokens: 800,
        temperature: 0.7,
      },
      {
        params: { "api-version": API_VERSION },
        headers: {
          "api-key": AZURE_API_KEY,
          "Content-Type": "application/json",
        },
        retry: 3,
        retryDelay: 1000,
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log("5. AI Response received:", aiResponse);

    // Then analyze the response for biases
    console.log("6. Analyzing response for biases...");
    const biasAnalysisResponse = await axiosInstance.post(
      `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`,
      {
        messages: [
          {
            role: "system",
            content: biasAnalysisPrompt,
          },
          { role: "user", content: aiResponse },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        params: { "api-version": API_VERSION },
        headers: {
          "api-key": AZURE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    let biases = [];
    try {
      const biasContent = biasAnalysisResponse.data.choices[0].message.content;
      console.log("7. Raw bias analysis:", biasContent);
      const biasAnalysis = JSON.parse(biasContent);
      // Clean up bias types
      biases = biasAnalysis.biases.map((bias) => ({
        ...bias,
        type: cleanBiasType(bias.type),
      }));
      console.log("8. Parsed biases:", biases);
    } catch (parseError) {
      console.error("Error parsing bias analysis:", parseError);
    }

    // Send both the response and biases
    console.log("9. Sending response with", biases.length, "biases");
    return res.json({
      success: true,
      response: aiResponse,
      biases: biases,
    });
  } catch (error) {
    console.error("\nDetailed Error:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });

    // Error handling...
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        error: {
          message: "Request timed out. Please try again.",
        },
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
});

app.post("/api/analyze-bias", async (req, res) => {
  try {
    const { systemPrompt, userInput } = req.body;

    console.log("Bias Analysis Request:", {
      systemPrompt,
      userInput,
    });

    const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`;

    const response = await axios.post(
      url,
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        params: {
          "api-version": API_VERSION,
        },
        headers: {
          "api-key": AZURE_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Azure Bias Analysis Response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });

    const content = response.data.choices[0].message.content;
    let analysis;
    try {
      analysis = JSON.parse(content);
      // Clean up bias types
      if (analysis.biases) {
        analysis.biases = analysis.biases.map((bias) => ({
          ...bias,
          type: cleanBiasType(bias.type),
        }));
      }
      console.log("Parsed Bias Analysis:", analysis);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", content);
      analysis = { biases: [] };
    }

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing bias:", {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    res.status(500).json({ biases: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Initial DNS check
  const hostname = getHostname(AZURE_ENDPOINT);
  if (hostname) {
    checkDNSConnection(hostname)
      .then(() => console.log("Initial DNS check successful"))
      .catch((err) => console.error("Initial DNS check failed:", err));
  }
});
