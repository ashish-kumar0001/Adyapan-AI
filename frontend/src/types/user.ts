export type UserRole = "user" | "admin";

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Profile = {
  id: string;
  userId: string;
  college: string;
  branch: string;
  skills: string[];
  linkedin?: string;
  github?: string;
  resumeUrl?: string;
};

