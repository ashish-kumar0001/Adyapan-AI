import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "Adyapan AI API",
  });
});

app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Adyapan AI API running on http://localhost:${env.port}`);
});
