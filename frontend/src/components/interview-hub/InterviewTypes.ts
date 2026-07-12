export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  areasForImprovement: string[];
  suggestedAnswers: string[];
  recommendedResources: string[];
}

export interface InterviewSession {
  id: string;
  role: string;
  company: string | null;
  type: string;
  difficulty: string;
  language: string;
  durationMinutes: number;
  technology: string | null;
  aiVoiceEnabled: boolean;
  videoEnabled: boolean;
  status: string;
  violationPoints: number;
  violationThreshold: number;
  feedback: InterviewFeedback | null;
  identityVerification: Record<string, any>;
  deviceInfo: Record<string, any>;
  systemCheck: Record<string, any>;
  configuration: Record<string, any>;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  evaluation: InterviewEvaluation | null;
  violationReport: ViolationReport | null;
}

export interface InterviewMessage {
  id: string;
  sessionId: string;
  role: "interviewer" | "user" | "feedback";
  content: string;
  audioUrl?: string;
  duration?: number;
  createdAt: string;
}

export interface InterviewEvaluation {
  id: string;
  overallScore: number;
  communicationScore: number;
  technicalScore: number | null;
  hrScore: number | null;
  confidenceScore: number | null;
  fluencyScore: number | null;
  bodyLanguageScore: number | null;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
  hiringRecommendation: string;
  detailedAnalysis: Record<string, any>;
}

export interface ViolationReport {
  totalViolations: number;
  totalPoints: number;
  threshold: number;
  thresholdReached: boolean;
  violations: ViolationSummary[];
  timeline: ViolationTimelineEntry[];
  recommendation: string;
}

export interface ViolationSummary {
  type: string;
  count: number;
  totalPoints: number;
}

export interface ViolationTimelineEntry {
  timestamp: string;
  eventType: string;
  description: string;
  severity: string;
  pointsDeducted: number;
  screenshotData?: string;
}

export interface ProctoringEvent {
  id: string;
  eventType: string;
  category: string;
  description: string;
  confidence: number;
  severity: string;
  pointsDeducted: number;
  createdAt: string;
}

export interface SystemCheckItem {
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
}

export interface EnvironmentScanResult {
  passed: boolean;
  overallScore: number;
  checks: EnvironmentCheck[];
  recommendations: string[];
}

export interface EnvironmentCheck {
  name: string;
  category: string;
  status: "pass" | "fail" | "warning";
  message: string;
  confidence: number;
}

export interface IdentityVerification {
  verified: boolean;
  confidence: number;
  qualityScore: number;
  issues: string[];
  timestamp: string;
}

export interface InterviewConfig {
  role: string;
  company?: string;
  type: "technical" | "behavioral" | "general";
  difficulty: "easy" | "medium" | "hard";
  language: string;
  durationMinutes: number;
  technology?: string;
  experience?: string;
  aiVoiceEnabled: boolean;
  videoEnabled: boolean;
}

export type InterviewScreen =
  | "dashboard"
  | "active"
  | "feedback"
  | "config"
  | "identity"
  | "system-check"
  | "environment-scan"
  | "rules"
  | "initializing"
  | "terminated";

