import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/adyapan_ai",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "replace-this-local-secret-before-production",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

if (env.nodeEnv === "production" && env.jwtSecret === "replace-this-local-secret-before-production") {
  throw new Error("JWT_SECRET must be set in production");
}
