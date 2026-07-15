import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

import compression from "compression";
import { PerformanceMonitor } from "./utils/monitoring";

const app = express();

// Trust Railway's proxy so rate-limit reads the real client IP
app.set("trust proxy", 1);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.originalUrl && req.originalUrl.startsWith("/api")) {
      PerformanceMonitor.record("api", `${req.method} ${req.originalUrl}`, duration);
      if (res.statusCode >= 400) {
        PerformanceMonitor.record("error", `${req.method} ${req.originalUrl}`, duration, { status: res.statusCode });
      }
    }
  });
  next();
});

app.use(compression({
  filter: (req, res) => {
    const contentType = res.getHeader("Content-Type");
    if (typeof contentType === "string" && contentType.includes("text/event-stream")) return false;
    if (req.headers.accept === "text/event-stream") return false;
    return compression.filter(req, res);
  },
}));
app.use(helmet());

const allowedOrigins = [
  env.frontendUrl,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://adyapan-ai-gamma.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-timezone", "Accept", "Cache-Control"],
  }),
);

// Rate limiting
app.use(
  "/api/auth",
  rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    standardHeaders: true, 
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, trustProxy: false }
  }),
);
app.use(
  "/api",
  rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    standardHeaders: true, 
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, trustProxy: false }
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ success: true, service: "Adyapan AI API", version: "1.0.0" });
});

app.use("/api", apiRouter);
app.use(errorHandler);

import { createServer } from "http";
import { initSocketServer } from "./lib/socket";
import { seedChallengesIfNeeded } from "./utils/challengeSeeder";

const server = createServer(app);
initSocketServer(server);

server.listen(env.port, "0.0.0.0", () => {
  console.log(`Adyapan AI API running on http://0.0.0.0:${env.port}`);
  seedChallengesIfNeeded().catch(err => {
    console.error("[Seeder] Failed to seed challenges on startup:", err);
  });
});

