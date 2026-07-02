import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { User } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { httpError } from "../utils/httpError";
import type { AuthRole } from "../middleware/auth";

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

const tokenOptions: SignOptions = {
  expiresIn: "7d",
};

function normalizeRole(role?: string): AuthRole {
  return role?.toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
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

function signToken(user: Pick<User, "id" | "email" | "role">) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    tokenOptions,
  );
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw httpError(409, "Email is already registered");
  }

  const password = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      password,
      role: normalizeRole(input.role),
      profile: {
        create: {},
      },
    },
  });

  return {
    user: publicUser(user),
    token: signToken(user),
  };
}

export async function loginUser(input: LoginInput) {
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
    token: signToken(user),
  };
}
