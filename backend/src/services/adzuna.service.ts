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

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AdzunaSearchParams {
  what?: string;
  where?: string;
  country?: string;
  page?: number;
  resultsPerPage?: number;
  sortBy?: string;
  sortDirection?: string;
  salaryMin?: number;
  salaryMax?: number;
  category?: string;
  fullTime?: boolean;
  permanent?: boolean;
  maxDaysOld?: number;
  whatExclude?: string;
}

export interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  category: { label: string; tag: string };
  created: string;
  redirect_url: string;
  contract_type?: string;
  contract_time?: string;
  adref?: string;
}

export interface AdzunaSearchResponse {
  count: number;
  mean?: number;
  results: AdzunaJob[];
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAuthParams(): string {
  return `app_id=${env.adzuna.appId}&app_key=${env.adzuna.appKey}`;
}

function normalizeJob(job: AdzunaJob, countryCode: string): NormalizedJob {
  const area = job.location?.area || [];
  const countryName = area[0] || ADZUNA_COUNTRIES.find(c => c.code === countryCode)?.name || "";
  const state = area.length > 2 ? area[1] : (area.length > 1 ? area[1] : "");
  const city = area.length > 1 ? area[area.length - 1] : job.location?.display_name || "";

  const contractType = job.contract_type || "";
  const contractTime = job.contract_time || "";

  let employmentType = "Full-Time";
  if (contractType === "contract") employmentType = "Contract";
  else if (contractType === "temporary") employmentType = "Part-Time";
  else if (contractTime === "part_time") employmentType = "Part-Time";

  let mode = "On-site";
  const descLower = (job.description || "").toLowerCase();
  if (descLower.includes("remote")) mode = "Remote";
  else if (descLower.includes("hybrid")) mode = "Hybrid";

  const skills = extractSkills(job.description || "", job.title || "");

  const salaryMin = job.salary_min || undefined;
  const salaryMax = job.salary_max || undefined;
  let salary: string | undefined;
  if (salaryMin && salaryMax) {
    salary = `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()}`;
  } else if (salaryMin) {
    salary = `From ${salaryMin.toLocaleString()}`;
  } else if (salaryMax) {
    salary = `Up to ${salaryMax.toLocaleString()}`;
  }

  return {
    id: `adzuna_${job.id}`,
    title: job.title || "Untitled",
    company: job.company?.display_name || "Unknown Company",
    location: job.location?.display_name || "",
    country: countryName,
    state,
    city,
    mode,
    employmentType,
    salary,
    salaryMin,
    salaryMax,
    description: job.description || "",
    skills,
    postedDate: job.created || new Date().toISOString(),
    category: job.category?.label || "",
    applyUrl: job.redirect_url || "",
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
  const page = params.page || 1;
  const resultsPerPage = Math.min(params.resultsPerPage || 20, 50);

  const queryParams = new URLSearchParams();
  queryParams.set("app_id", env.adzuna.appId);
  queryParams.set("app_key", env.adzuna.appKey);
  queryParams.set("results_per_page", String(resultsPerPage));
  queryParams.set("content-type", "application/json");

  if (params.what) queryParams.set("what", params.what);
  if (params.where) queryParams.set("where", params.where);
  if (params.sortBy) queryParams.set("sort_by", params.sortBy);
  if (params.sortDirection) queryParams.set("sort_direction", params.sortDirection);
  if (params.salaryMin) queryParams.set("salary_min", String(params.salaryMin));
  if (params.salaryMax) queryParams.set("salary_max", String(params.salaryMax));
  if (params.category) queryParams.set("category", params.category);
  if (params.fullTime) queryParams.set("full_time", "1");
  if (params.permanent) queryParams.set("permanent", "1");
  if (params.maxDaysOld) queryParams.set("max_days_old", String(params.maxDaysOld));
  if (params.whatExclude) queryParams.set("what_exclude", params.whatExclude);

  const url = `${BASE_URL}/jobs/${countryCode}/search/${page}?${queryParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Adzuna] API error: ${res.status} ${res.statusText}`);
      return { jobs: [], count: 0 };
    }
    const data: AdzunaSearchResponse = await res.json();
    const jobs = (data.results || []).map(job => normalizeJob(job, countryCode));
    return { jobs, count: data.count || 0 };
  } catch (error) {
    console.error("[Adzuna] Search failed:", error);
    return { jobs: [], count: 0 };
  }
}

export async function searchAllCountries(params: Omit<AdzunaSearchParams, "country">): Promise<{ jobs: NormalizedJob[]; count: number }> {
  const countries: AdzunaCountryCode[] = ["us", "gb", "in", "de", "fr", "au", "ca", "nz", "br", "pl", "at", "za", "be", "ch", "es", "it", "mx", "nl", "sg"];

  const results = await Promise.allSettled(
    countries.map(code =>
      searchAdzunaJobs({ ...params, country: code, resultsPerPage: Math.ceil((params.resultsPerPage || 20) / 3) })
    )
  );

  let allJobs: NormalizedJob[] = [];
  let totalCount = 0;

  for (const r of results) {
    if (r.status === "fulfilled") {
      allJobs = allJobs.concat(r.value.jobs);
      totalCount += r.value.count;
    }
  }

  // Sort combined results
  const sortBy = params.sortBy || "date";
  allJobs.sort((a, b) => {
    if (sortBy === "salary") {
      return (b.salaryMax || 0) - (a.salaryMax || 0);
    }
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });

  return { jobs: allJobs, count: totalCount };
}

export async function getAdzunaCategories(countryCode: string = "gb"): Promise<{ tag: string; label: string }[]> {
  const url = `${BASE_URL}/jobs/${countryCode.toLowerCase()}/categories?${getAuthParams()}&content-type=application/json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((c: any) => ({ tag: c.tag, label: c.label }));
  } catch (error) {
    console.error("[Adzuna] Failed to fetch categories:", error);
    return [];
  }
}

export function getSupportedCountries() {
  return ADZUNA_COUNTRIES.map(c => ({ code: c.code, name: c.name, currency: c.currency }));
}
