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
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5501",
  "http://localhost:5502",
  "http://127.0.0.1:5501",
  "http://127.0.0.1:5502",
  "https://cmlmanni.github.io",
  "https://cmlmanni.github.io/AyeEye",
  "https://debiasme.github.io",
];

app.use(
  cors({
    origin: function (origin, callback) {
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
    maxAge: 86400,
  })
);
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
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
