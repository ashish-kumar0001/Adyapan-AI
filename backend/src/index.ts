import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Allow both local dev and production frontend URLs
const allowedOrigins = [
  env.frontendUrl,
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Return 403 instead of throwing — prevents 500 errors
      return callback(null, false);
    },
    credentials: true,
  }),
);

// Rate limiting
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }),
);
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ success: true, service: "Adyapan AI API", version: "1.0.0" });
});

app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Adyapan AI API running on http://0.0.0.0:${env.port}`);
});
