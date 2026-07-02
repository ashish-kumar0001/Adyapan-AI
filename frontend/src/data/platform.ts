import type { UserRole } from "@/types/user";

export const landingStats = [
  { label: "Active users", value: "1,248" },
  { label: "Profiles completed", value: "842" },
  { label: "Platform tools", value: "60+" },
];

export const landingFeatures = [
  {
    title: "AI Study Assistant",
    description: "Get instant answers to complex academic queries, auto-generate summaries, flashcards, and conceptual study plans tailored to your syllabus.",
    image: "/assets/study-assistant.png",
  },
  {
    title: "AI Career Guide",
    description: "Chart your roadmap. Input your interests, skills, and values to find optimal roles and targeted project suggestions to match current tech demands.",
    image: "/assets/career-guide.png",
  },
  {
    title: "AI Resume Builder",
    description: "Generate highly-optimized ATS resumes. Receive real-time grading, skills gap analysis, and tailored bullet point enhancements for your dream jobs.",
    image: "/assets/resume-builder.png",
  },
  {
    title: "AI Interview Coach",
    description: "Practice live mock interviews tailored to companies and roles. Receive structured evaluations on body language, coding speed, and communication quality.",
    image: "/assets/interview-coach.png",
  },
  {
    title: "AI Internship Assistant",
    description: "Match with the best micro-internship opportunities and remote gigs based on your live academic profile and project portfolio.",
    image: "/assets/internship-assistant.png",
  },
  {
    title: "AI Placement Hub",
    description: "Unlock structured referral channels and direct hiring partnerships with leading startups and global MNCs. Apply with your verified Adyapan profile.",
    image: "/assets/placement-hub.png",
  },
];

export const landingSteps = [
  {
    step: "01",
    title: "Create Profile",
    description: "Sign up, enter your basic academics details, and build a unified dashboard representation of your educational accomplishments.",
  },
  {
    step: "02",
    title: "Choose Career Goal",
    description: "Define your primary targets (e.g. Software Development, Data Analytics, Product Management) to customize your dashboard feeds.",
  },
  {
    step: "03",
    title: "Learn with AI",
    description: "Access notes, generate summaries, and study using our customized study tools that sync with your university syllabus.",
  },
  {
    step: "04",
    title: "Prepare for Interviews",
    description: "Solve mock coding challenges, build targeted resumes, and run real-time behavioral drills with the Interview Coach.",
  },
  {
    step: "05",
    title: "Find Opportunities",
    description: "Apply to exclusive internships, college events, and hackathons curated specifically based on your verified credentials.",
  },
  {
    step: "06",
    title: "Get Hired",
    description: "Get fast-tracked into recruiter screens with hiring partners using verified profile metrics. Accelerate your career launch.",
  },
];

export const landingTestimonials = [
  {
    text: "Adyapan AI completely changed my internship search. The Resume Builder ATS analysis got me 5 interviews in 2 weeks, and the interview coach's feedback gave me the confidence to land my SDE offer.",
    author: "Aditi Sharma",
    role: "SDE Intern at TechCorp (Computer Science, 4th Year)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  },
  {
    text: "The AI Study Assistant matches my college syllabus perfectly. Generating flashcards and summaries has saved me hours of manual note-taking before end-semester exams. Highly recommend!",
    author: "Rahul Verma",
    role: "B.Tech IT (3rd Year)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  },
];

export const landingFAQs = [
  {
    question: "Is Adyapan AI free for college users?",
    answer: "Yes, our core tools—including the Study Assistant, ATS Resume check, and basic Interview coaching credits—are completely free for users. Premium options are available for extended mockup durations.",
  },
  {
    question: "How does the Resume Builder score work?",
    answer: "Our system runs your resume against standard Applicant Tracking System (ATS) rules, measuring keyword density, section headers layout, and action verb strength to calculate a live score.",
  },
  {
    question: "Can I share my verified metrics directly with recruiters?",
    answer: "Absolutely! Once your profile and credentials are verified, you can export a public dashboard link to share with recruiters or link it directly on your LinkedIn.",
  },
];

export const foundationModules = [
  "Role-based user access",
  "Profile and resume fields",
  "Admin operations surface",
  "Backend API contract",
];

export const userDashboardStats = [
  { label: "Profile completion", value: "72%" },
  { label: "Saved skills", value: "8" },
  { label: "Resume status", value: "Uploaded" },
];

export const adminDashboardStats = [
  { label: "Total users", value: "1,248" },
  { label: "Admins", value: "6" },
  { label: "Profiles completed", value: "842" },
];

export const roleLabels: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
};
