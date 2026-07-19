import { env } from "../config/env";

const BASE_URL = "https://api.adzuna.com/v1/api";

// ─── Supported Countries ─────────────────────────────────────────────────────
export const ADZUNA_COUNTRIES = [
  { code: "gb", name: "United Kingdom", currency: "GBP" },
  { code: "us", name: "United States", currency: "USD" },
  { code: "in", name: "India", currency: "INR" },
  { code: "de", name: "Germany", currency: "EUR" },
  { code: "fr", name: "France", currency: "EUR" },
  { code: "au", name: "Australia", currency: "AUD" },
  { code: "ca", name: "Canada", currency: "CAD" },
  { code: "nz", name: "New Zealand", currency: "NZD" },
  { code: "br", name: "Brazil", currency: "BRL" },
  { code: "pl", name: "Poland", currency: "PLN" },
  { code: "at", name: "Austria", currency: "EUR" },
  { code: "za", name: "South Africa", currency: "ZAR" },
  { code: "be", name: "Belgium", currency: "EUR" },
  { code: "ch", name: "Switzerland", currency: "CHF" },
  { code: "es", name: "Spain", currency: "EUR" },
  { code: "it", name: "Italy", currency: "EUR" },
  { code: "mx", name: "Mexico", currency: "MXN" },
  { code: "nl", name: "Netherlands", currency: "EUR" },
  { code: "sg", name: "Singapore", currency: "SGD" },
] as const;

export type AdzunaCountryCode = (typeof ADZUNA_COUNTRIES)[number]["code"];

// ─── Adzuna API Response Types ───────────────────────────────────────────────
export interface AdzunaJobListing {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
}

export interface AdzunaJobListingsResponse {
  job_listings: AdzunaJobListing[];
}

export interface AdzunaSalaryResponse {
  average_salary: string;
  min_salary: string;
  max_salary: string;
}

export interface AdzunaCompanyReview {
  rating: number;
  review_text: string;
}

export interface AdzunaCompanyReviewsResponse {
  company_name: string;
  reviews: AdzunaCompanyReview[];
}

// ─── Search Params ───────────────────────────────────────────────────────────
export interface AdzunaSearchParams {
  keywords?: string;
  location?: string;
  radius?: number;
  country?: string;
  page?: number;
  resultsPerPage?: number;
}

export interface AdzunaSalaryParams {
  jobTitle: string;
  location?: string;
}

export interface AdzunaCompanyParams {
  companyName: string;
}

// ─── Normalized Types ────────────────────────────────────────────────────────
export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  state: string;
  city: string;
  mode: string;
  employmentType: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  skills: string[];
  postedDate: string;
  category?: string;
  applyUrl?: string;
  isAdzuna: boolean;
  logoBg?: string;
  isFeatured?: boolean;
}

export interface SalaryInsight {
  averageSalary: string;
  minSalary: string;
  maxSalary: string;
}

export interface CompanyReview {
  rating: number;
  reviewText: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAuthParams(): string {
  return `app_id=${env.adzuna.appId}&app_key=${env.adzuna.appKey}`;
}

function normalizeJob(listing: AdzunaJobListing, countryCode: string): NormalizedJob {
  const countryName = ADZUNA_COUNTRIES.find(c => c.code === countryCode)?.name || "";
  const parts = (listing.location || "").split(",").map(s => s.trim());
  const state = parts.length > 1 ? parts[parts.length - 2] : "";
  const city = parts.length > 0 ? parts[parts.length - 1] : "";

  let mode = "On-site";
  const descLower = (listing.description || "").toLowerCase();
  if (descLower.includes("remote")) mode = "Remote";
  else if (descLower.includes("hybrid")) mode = "Hybrid";

  let employmentType = "Full-Time";
  if (descLower.includes("contract") || descLower.includes("freelance")) employmentType = "Contract";
  else if (descLower.includes("part-time") || descLower.includes("part time")) employmentType = "Part-Time";

  const skills = extractSkills(listing.description || "", listing.title || "");

  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  if (listing.salary) {
    const salaryNums = listing.salary.replace(/[^0-9\-]/g, "").split("-").map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    if (salaryNums.length >= 2) {
      salaryMin = salaryNums[0];
      salaryMax = salaryNums[1];
    } else if (salaryNums.length === 1) {
      salaryMin = salaryNums[0];
    }
  }

  const titleSlug = (listing.title || "job").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    id: `adzuna_${countryCode}_${titleSlug}_${Date.now()}`,
    title: listing.title || "Untitled",
    company: listing.company || "Unknown Company",
    location: listing.location || "",
    country: countryName,
    state,
    city,
    mode,
    employmentType,
    salary: listing.salary,
    salaryMin,
    salaryMax,
    description: listing.description || "",
    skills,
    postedDate: new Date().toISOString(),
    category: "",
    applyUrl: "",
    isAdzuna: true,
    isFeatured: false,
  };
}

function extractSkills(description: string, title: string): string[] {
  const techKeywords = [
    "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "rust", "php",
    "react", "angular", "vue", "nextjs", "nodejs", "django", "flask", "spring", "rails",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform",
    "sql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "html", "css", "sass", "tailwind", "bootstrap",
    "git", "ci/cd", "jenkins", "github actions",
    "machine learning", "deep learning", "tensorflow", "pytorch", "nlp",
    "agile", "scrum", "jira", "figma", "sketch",
    "rest api", "graphql", "grpc", "microservices",
    "linux", "bash", "powershell",
    "salesforce", "sap", "oracle", "blockchain", "solidity",
    "data analysis", "power bi", "tableau", "excel",
    "communication", "leadership", "team management", "problem solving",
  ];

  const text = `${title} ${description}`.toLowerCase();
  const found = techKeywords.filter(kw => text.includes(kw));
  return [...new Set(found)].slice(0, 10);
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function searchAdzunaJobs(params: AdzunaSearchParams): Promise<{ jobs: NormalizedJob[]; count: number }> {
  const countryCode = (params.country || "gb").toLowerCase();
  const keywords = params.keywords || params.location || "";
  const location = params.location || "";

  const queryParams = new URLSearchParams();
  queryParams.set("app_id", env.adzuna.appId);
  queryParams.set("app_key", env.adzuna.appKey);
  if (keywords) queryParams.set("keywords", keywords);
  if (location) queryParams.set("location", location);
  if (params.radius) queryParams.set("radius", String(params.radius));

  const url = `${BASE_URL}/job_listings?${queryParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Adzuna] API error: ${res.status} ${res.statusText}`);
      return { jobs: [], count: 0 };
    }
    const data: AdzunaJobListingsResponse = await res.json();
    const jobs = (data.job_listings || []).map(listing => normalizeJob(listing, countryCode));
    return { jobs, count: jobs.length };
  } catch (error) {
    console.error("[Adzuna] Search failed:", error);
    return { jobs: [], count: 0 };
  }
}

export async function getAdzunaSalary(params: AdzunaSalaryParams): Promise<SalaryInsight | null> {
  const queryParams = new URLSearchParams();
  queryParams.set("app_id", env.adzuna.appId);
  queryParams.set("app_key", env.adzuna.appKey);
  queryParams.set("job_title", params.jobTitle);
  if (params.location) queryParams.set("location", params.location);

  const url = `${BASE_URL}/salary_information?${queryParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Adzuna] Salary API error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data: AdzunaSalaryResponse = await res.json();
    return {
      averageSalary: data.average_salary || "",
      minSalary: data.min_salary || "",
      maxSalary: data.max_salary || "",
    };
  } catch (error) {
    console.error("[Adzuna] Salary fetch failed:", error);
    return null;
  }
}

export async function getAdzunaCompanyReviews(params: AdzunaCompanyParams): Promise<CompanyReview[]> {
  const queryParams = new URLSearchParams();
  queryParams.set("app_id", env.adzuna.appId);
  queryParams.set("app_key", env.adzuna.appKey);
  queryParams.set("company_name", params.companyName);

  const url = `${BASE_URL}/company_reviews?${queryParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Adzuna] Reviews API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data: AdzunaCompanyReviewsResponse = await res.json();
    return (data.reviews || []).map(r => ({
      rating: r.rating || 0,
      reviewText: r.review_text || "",
    }));
  } catch (error) {
    console.error("[Adzuna] Reviews fetch failed:", error);
    return [];
  }
}

export function getSupportedCountries() {
  return ADZUNA_COUNTRIES.map(c => ({ code: c.code, name: c.name, currency: c.currency }));
}
