import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import chatRoutes from "./backend/routes/chatRoutes.js";
import biasRoutes from "./backend/routes/biasRoutes.js";
import { checkDNSConnection, getHostname } from "./backend/utils/dnsUtils.js";
import {
  AZURE_API_KEY,
  AZURE_ENDPOINT,
  AZURE_DEPLOYMENT,
} from "./backend/config.js";

// These two lines are needed if you use ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Use Render's port if available

const isDev = process.env.NODE_ENV !== "production";
const allowedOrigins = isDev
  ? true
  : [
      "https://ayeeye.onrender.com",
      "https://debiasme.github.io",
      "https://cmlmanni.github.io/AyeEye",
    ];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use("/api", chatRoutes);
app.use("/api", biasRoutes);

app.listen(PORT, "0.0.0.0", () => {
  // Bind to all interfaces
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  const hostname = getHostname(process.env.AZURE_OPENAI_ENDPOINT);
  if (hostname) {
    checkDNSConnection(hostname)
      .then(() => console.log("Initial DNS check successful"))
      .catch((err) => console.error("Initial DNS check failed:", err));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      message: "A server error occurred. Please try again later.",
      // Optionally add: code: err.code, details: err.message (for debugging)
    },
  });
});
