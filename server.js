import express from "express";
import cors from "cors";
import chatRoutes from "./backend/routes/chatRoutes.js";
import biasRoutes from "./backend/routes/biasRoutes.js";
import { checkDNSConnection, getHostname } from "./backend/utils/dnsUtils.js";
import {
  AZURE_API_KEY,
  AZURE_ENDPOINT,
  AZURE_DEPLOYMENT,
} from "./backend/config.js";

const app = express();
const PORT = 3000;

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

app.use("/api", chatRoutes);
app.use("/api", biasRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
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
