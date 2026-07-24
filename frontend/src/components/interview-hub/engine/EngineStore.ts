import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  EngineConfig,
  EngineMessage,
  EngineEvaluation,
  EngineScreen,
  EngineSession,
  EngineHistoryEntry,
  TranscriptEntry,
  InterviewType,
  DifficultyLevel,
  ExperienceLevel,
} from "./EngineTypes";

interface EngineState {
  screen: EngineScreen;
  config: EngineConfig;
  session: EngineSession | null;
  messages: EngineMessage[];
  transcript: TranscriptEntry[];
  evaluation: EngineEvaluation | null;
  history: EngineHistoryEntry[];
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
  searchQuery: string;
  highlightedMessages: Set<string>;

  setScreen: (screen: EngineScreen) => void;
  setConfig: (config: Partial<EngineConfig>) => void;
  setSession: (session: EngineSession | null) => void;
  setMessages: (messages: EngineMessage[]) => void;
  addMessage: (message: EngineMessage) => void;
  setTranscript: (transcript: TranscriptEntry[]) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  highlightTranscriptEntry: (id: string, highlighted: boolean) => void;
  setEvaluation: (evaluation: EngineEvaluation | null) => void;
  setHistory: (history: EngineHistoryEntry[]) => void;
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
  setSearchQuery: (query: string) => void;
  reset: () => void;
  incrementDifficulty: () => void;
}

const DEFAULT_CONFIG: EngineConfig = {
  interviewType: "system-design",
  targetRole: "Software Engineer",
  targetCompany: "",
  difficulty: "medium",
  experienceLevel: "mid",
  durationMinutes: 30,
  technology: "",
  language: "english",
  aiVoiceEnabled: true,
  voiceGender: "neutral",
  voiceSpeed: 0.95,
  voicePitch: 1.0,
  resumeAware: true,
  customInstructions: "",
};

export const useEngineStore = create<EngineState>()(
  devtools(
    (set, get) => ({
      screen: "landing",
      config: DEFAULT_CONFIG,
      session: null,
      messages: [],
      transcript: [],
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
      searchQuery: "",
      highlightedMessages: new Set<string>(),

      setScreen: (screen) => set({ screen }),
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),
      setSession: (session) => set({ session }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setTranscript: (transcript) => set({ transcript }),
      addTranscriptEntry: (entry) =>
        set((state) => ({ transcript: [...state.transcript, entry] })),
      highlightTranscriptEntry: (id, highlighted) =>
        set((state) => {
          const newTranscript = state.transcript.map((t) =>
            t.id === id ? { ...t, isHighlighted: highlighted } : t
          );
          return { transcript: newTranscript };
        }),
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
      setSearchQuery: (query) => set({ searchQuery: query }),
      reset: () =>
        set({
          screen: "landing",
          session: null,
          messages: [],
          transcript: [],
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
          searchQuery: "",
        }),
      incrementDifficulty: () =>
        set((state) => {
          const levels: DifficultyLevel[] = ["easy", "medium", "hard"];
          const idx = levels.indexOf(state.config.difficulty);
          if (idx < levels.length - 1) {
            return { config: { ...state.config, difficulty: levels[idx + 1] } };
          }
          return {};
        }),
    }),
    { name: "engine-store" }
  )
);
