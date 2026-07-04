import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/adyapan_ai",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "replace-this-local-secret-before-production",
  adminRegisterSecret: process.env.ADMIN_REGISTER_SECRET ?? "adyapan-admin-2024",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

if (env.nodeEnv === "production" && env.jwtSecret === "replace-this-local-secret-before-production") {
  throw new Error("JWT_SECRET must be set in production");
}
