import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  HRConfig,
  HRMessage,
  HREvaluation,
  HRScreen,
  HRSession,
  HRHistoryEntry,
  HRCompetencyScore,
  STARAnalysis,
  CommunicationAnalysis,
} from "./HRTypes";

interface HRState {
  screen: HRScreen;
  config: HRConfig;
  session: HRSession | null;
  messages: HRMessage[];
  evaluation: HREvaluation | null;
  history: HRHistoryEntry[];
  loading: boolean;
  sending: boolean;
  isVoiceActive: boolean;
  isListening: boolean;
  liveTranscript: string;
  currentTime: number;
  elapsedSeconds: number;
  questionNumber: number;
  totalQuestions: number;
  micLevel: number;
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  loadingStep: number;
  loadingComplete: boolean;
  currentCompetency: string;
  liveSTAR: STARAnalysis | null;
  liveCommunication: CommunicationAnalysis | null;
  competencyScores: HRCompetencyScore[];

  setScreen: (screen: HRScreen) => void;
  setConfig: (config: Partial<HRConfig>) => void;
  setSession: (session: HRSession | null) => void;
  setMessages: (messages: HRMessage[]) => void;
  addMessage: (message: HRMessage) => void;
  setEvaluation: (evaluation: HREvaluation | null) => void;
  setHistory: (history: HRHistoryEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setIsVoiceActive: (active: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setLiveTranscript: (text: string) => void;
  setCurrentTime: (time: number) => void;
  incrementElapsed: () => void;
  setQuestionNumber: (num: number) => void;
  setTotalQuestions: (num: number) => void;
  setMicLevel: (level: number) => void;
  setConnectionStatus: (status: "connected" | "reconnecting" | "disconnected") => void;
  setLoadingStep: (step: number) => void;
  setLoadingComplete: (complete: boolean) => void;
  setCurrentCompetency: (competency: string) => void;
  setLiveSTAR: (star: STARAnalysis | null) => void;
  setLiveCommunication: (comm: CommunicationAnalysis | null) => void;
  setCompetencyScores: (scores: HRCompetencyScore[]) => void;
  reset: () => void;
}

const DEFAULT_HR_CONFIG: HRConfig = {
  interviewType: "general_hr",
  targetRole: "Software Engineer",
  targetCompany: "",
  difficulty: "medium",
  experienceLevel: "mid",
  durationMinutes: 30,
  language: "english",
  aiVoiceEnabled: true,
  voiceGender: "neutral",
  voiceSpeed: 0.95,
  voicePitch: 1.0,
  resumeAware: true,
  customInstructions: "",
};

export const useHRStore = create<HRState>()(
  devtools(
    (set) => ({
      screen: "landing",
      config: DEFAULT_HR_CONFIG,
      session: null,
      messages: [],
      evaluation: null,
      history: [],
      loading: false,
      sending: false,
      isVoiceActive: false,
      isListening: false,
      liveTranscript: "",
      currentTime: Date.now(),
      elapsedSeconds: 0,
      questionNumber: 0,
      totalQuestions: 0,
      micLevel: 0,
      connectionStatus: "connected",
      loadingStep: 0,
      loadingComplete: false,
      currentCompetency: "communication",
      liveSTAR: null,
      liveCommunication: null,
      competencyScores: [],

      setScreen: (screen) => set({ screen }),
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),
      setSession: (session) => set({ session }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setEvaluation: (evaluation) => set({ evaluation }),
      setHistory: (history) => set({ history }),
      setLoading: (loading) => set({ loading }),
      setSending: (sending) => set({ sending }),
      setIsVoiceActive: (active) => set({ isVoiceActive: active }),
      setIsListening: (listening) => set({ isListening: listening }),
      setLiveTranscript: (text) => set({ liveTranscript: text }),
      setCurrentTime: (time) => set({ currentTime: time }),
      incrementElapsed: () =>
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
      setQuestionNumber: (num) => set({ questionNumber: num }),
      setTotalQuestions: (num) => set({ totalQuestions: num }),
      setMicLevel: (level) => set({ micLevel: level }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setLoadingStep: (step) => set({ loadingStep: step }),
      setLoadingComplete: (complete) => set({ loadingComplete: complete }),
      setCurrentCompetency: (competency) => set({ currentCompetency: competency }),
      setLiveSTAR: (star) => set({ liveSTAR: star }),
      setLiveCommunication: (comm) => set({ liveCommunication: comm }),
      setCompetencyScores: (scores) => set({ competencyScores: scores }),
      reset: () =>
        set({
          screen: "landing",
          session: null,
          messages: [],
          evaluation: null,
          loading: false,
          sending: false,
          isVoiceActive: false,
          isListening: false,
          liveTranscript: "",
          elapsedSeconds: 0,
          questionNumber: 0,
          totalQuestions: 0,
          micLevel: 0,
          connectionStatus: "connected",
          loadingStep: 0,
          loadingComplete: false,
          currentCompetency: "communication",
          liveSTAR: null,
          liveCommunication: null,
          competencyScores: [],
        }),
    }),
    { name: "hr-interview-store" }
  )
);
