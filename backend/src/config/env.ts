import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/adyapan_ai",
  directUrl: process.env.DIRECT_URL ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET ?? "replace-this-local-secret-before-production",
  adminRegisterSecret: process.env.ADMIN_REGISTER_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  },
  neon: {
    apiKey: process.env.NEON_API_KEY ?? "",
    projectId: process.env.NEON_PROJECT_ID ?? "",
    branchId: process.env.NEON_BRANCH_ID ?? "",
    regionId: process.env.NEON_REGION_ID ?? "aws-us-east-1",
  },
  codeforces: {
    apiKey: process.env.CODEFORCES_API_KEY ?? "",
    apiSecret: process.env.CODEFORCES_API_SECRET ?? "",
  },
  pistonUrl: process.env.PISTON_URL ?? "http://localhost:2000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  masterDatabaseUrl: process.env.MASTER_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
};

if (env.nodeEnv === "production" && env.jwtSecret === "replace-this-local-secret-before-production") {
  throw new Error("JWT_SECRET must be set in production");
}

if (env.nodeEnv === "production" && !env.adminRegisterSecret) {
  throw new Error("ADMIN_REGISTER_SECRET must be set in production");
}
