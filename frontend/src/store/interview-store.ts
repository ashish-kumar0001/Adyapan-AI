import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface InterviewMessage {
  id: string;
  sessionId: string;
  role: "interviewer" | "user" | "candidate";
  content: string;
  audioUrl?: string;
  duration?: number;
  createdAt: string;
}

export interface InterviewEvaluation {
  id?: string;
  overallScore: number;
  communicationScore: number;
  technicalScore?: number;
  hrScore?: number;
  confidenceScore?: number;
  fluencyScore?: number;
  bodyLanguageScore?: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
  hiringRecommendation: string;
  detailedAnalysis?: Record<string, unknown>;
}

export interface ProctoringEvent {
  id?: string;
  sessionId: string;
  eventType: string;
  category: string;
  description: string;
  confidence: number;
  severity: "info" | "warning" | "critical";
  actionTaken?: string;
  pointsDeducted: number;
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  userId?: string;
  role: string;
  company?: string;
  type: string;
  difficulty: string;
  language: string;
  durationMinutes: number;
  technology?: string;
  aiVoiceEnabled: boolean;
  videoEnabled: boolean;
  status: string;
  violationPoints: number;
  violationThreshold: number;
  feedback?: Record<string, unknown>;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  messages?: InterviewMessage[];
  evaluation?: InterviewEvaluation;
  evaluations?: InterviewEvaluation[];
  violations?: ProctoringEvent[];
  violationReport?: {
    totalViolations: number;
    totalPoints: number;
    threshold: number;
    violations: Array<{ type: string; count: number; totalPoints: number }>;
  };
  state?: Record<string, unknown>;
}

export interface InterviewConfig {
  role: string;
  company: string;
  type: "technical" | "behavioral" | "general";
  difficulty: "easy" | "medium" | "hard";
  language: string;
  durationMinutes: number;
  technology: string;
  experience: string;
  aiVoiceEnabled: boolean;
  videoEnabled: boolean;
}

type AppScreen =
  | "dashboard"
  | "config"
  | "identity"
  | "system-check"
  | "environment-scan"
  | "rules"
  | "initializing"
  | "active"
  | "feedback"
  | "terminated";

interface InterviewState {
  // Session
  session: InterviewSession | null;
  messages: InterviewMessage[];
  history: InterviewSession[];
  config: InterviewConfig;
  screen: AppScreen;

  // Proctoring
  proctoringEvents: ProctoringEvent[];
  violationPoints: number;

  // UI State
  loading: boolean;
  sending: boolean;
  isVoiceRecording: boolean;
  liveTranscript: string;

  // Actions
  setSession: (session: InterviewSession | null) => void;
  setMessages: (messages: InterviewMessage[]) => void;
  addMessage: (message: InterviewMessage) => void;
  setHistory: (history: InterviewSession[]) => void;
  setConfig: (config: Partial<InterviewConfig>) => void;
  setScreen: (screen: AppScreen) => void;
  addProctoringEvent: (event: ProctoringEvent) => void;
  setProctoringEvents: (events: ProctoringEvent[]) => void;
  setViolationPoints: (points: number) => void;
  incrementViolations: (points: number) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setIsVoiceRecording: (isVoiceRecording: boolean) => void;
  setLiveTranscript: (text: string) => void;
  reset: () => void;
}

const DEFAULT_CONFIG: InterviewConfig = {
  role: "Software Engineer",
  company: "",
  type: "technical",
  difficulty: "medium",
  language: "english",
  durationMinutes: 30,
  technology: "",
  experience: "mid",
  aiVoiceEnabled: true,
  videoEnabled: true,
};

export const useInterviewStore = create<InterviewState>()(
  devtools(
    (set) => ({
      session: null,
      messages: [],
      history: [],
      config: DEFAULT_CONFIG,
      screen: "dashboard",
      proctoringEvents: [],
      violationPoints: 0,
      loading: false,
      sending: false,
      isVoiceRecording: false,
      liveTranscript: "",

      setSession: (session) => set({ session }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setHistory: (history) => set({ history }),
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),
      setScreen: (screen) => set({ screen }),
      addProctoringEvent: (event) =>
        set((state) => ({
          proctoringEvents: [...state.proctoringEvents, event],
        })),
      setProctoringEvents: (events) => set({ proctoringEvents: events }),
      setViolationPoints: (violationPoints) => set({ violationPoints }),
      incrementViolations: (points) =>
        set((state) => ({
          violationPoints: state.violationPoints + points,
        })),
      setLoading: (loading) => set({ loading }),
      setSending: (sending) => set({ sending }),
      setIsVoiceRecording: (isVoiceRecording) => set({ isVoiceRecording }),
      setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
      reset: () =>
        set({
          session: null,
          messages: [],
          config: DEFAULT_CONFIG,
          screen: "dashboard",
          proctoringEvents: [],
          violationPoints: 0,
          loading: false,
          sending: false,
          isVoiceRecording: false,
          liveTranscript: "",
        }),
    }),
    { name: "interview-store" }
  )
);
