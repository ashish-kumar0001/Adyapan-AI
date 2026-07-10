import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { execSync } from "child_process";
import type { User } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { httpError } from "../utils/httpError";
import type { AuthRole } from "../middleware/auth";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { databaseService } from "./database.service";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

const TOKEN_SHORT = "15m";
const TOKEN_LONG = "7d";
const REFRESH_TOKEN_EXPIRY = "30d";

// Rate limiter for auth endpoints (10 attempts per IP per 15 minutes)
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 15 * 60,
});

function getTokenOptions(rememberMe?: boolean): SignOptions {
  return { expiresIn: rememberMe ? TOKEN_LONG : TOKEN_SHORT };
}

function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function signToken(user: Pick<User, "id" | "email" | "role">, rememberMe?: boolean) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      ...getTokenOptions(rememberMe),
      algorithm: "HS256",
    },
  );
}

function signRefreshToken(userId: string) {
  return jwt.sign(
    { userId },
    env.jwtSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: "HS256" }
  );
}

function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    throw httpError(400, "Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    throw httpError(400, "Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    throw httpError(400, "Password must contain at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw httpError(400, "Password must contain at least one special character");
  }
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw httpError(409, "Email is already registered");
  }

  validatePasswordStrength(input.password);
  const password = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      password,
      role: "USER",
      profile: {
        create: {},
      },
    },
  });

  try {
    const userDbName = `user_${user.id}`;
    
    await databaseService.createDatabase(userDbName);
    
    const dbUrl = await databaseService.getConnectionString(userDbName);
    
    execSync(`npx prisma db push --config=prisma/prisma.config.user.ts --accept-data-loss`, {
      cwd: process.cwd(),
      stdio: "pipe",
      env: { ...process.env, USER_DATABASE_URL: dbUrl },
    });
    console.log(`Migrated database ${userDbName} for user ${user.id}`);
    
    console.log(`Created database ${userDbName} for user ${user.id}`);
  } catch (error) {
    console.error(`Failed to create database for user ${user.id}:`, error);
  }

  return {
    user: publicUser(user),
    token: signToken(user, false),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function loginUser(input: LoginInput & { rememberMe?: boolean }) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw httpError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw httpError(401, "Invalid email or password");
  }

  return {
    user: publicUser(user),
    token: signToken(user, input.rememberMe),
    refreshToken: signRefreshToken(user.id),
  };
}

export async function refreshToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.jwtSecret, { algorithms: ["HS256"] }) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      throw httpError(404, "User not found");
    }

    return {
      token: signToken(user, false),
      refreshToken: signRefreshToken(user.id),
    };
  } catch (err) {
    throw httpError(401, "Invalid or expired refresh token");
  }
}

export async function logout(token: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.blacklistedToken.create({
    data: {
      token,
      expiresAt,
    },
  });
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const blacklisted = await prisma.blacklistedToken.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
  });

  return !!blacklisted;
}

export async function rateLimitAuthRequest(ip: string) {
  try {
    await rateLimiter.consume(ip);
  } catch (err) {
    throw httpError(429, "Too many requests");
  }
}
