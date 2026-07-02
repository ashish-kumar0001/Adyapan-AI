import { prisma } from "../config/prisma";

type ProfileInput = {
  college?: string;
  branch?: string;
  skills?: unknown;
  linkedin?: string;
  github?: string;
  resumeUrl?: string;
};

function normalizeSkills(skills: unknown) {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills.map((skill) => String(skill).trim()).filter(Boolean);
}

export function getProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });
}

export function upsertProfile(userId: string, input: ProfileInput) {
  const data = {
    college: input.college,
    branch: input.branch,
    skills: normalizeSkills(input.skills),
    linkedin: input.linkedin,
    github: input.github,
    resumeUrl: input.resumeUrl,
  };

  return prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });
}
