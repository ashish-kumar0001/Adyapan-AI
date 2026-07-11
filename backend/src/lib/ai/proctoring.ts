import { generateJSON, MODELS } from "./openrouter";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProctoringAnalysis {
  isViolation: boolean;
  eventType: string;
  category: "camera" | "screen" | "audio" | "object" | "keyboard";
  description: string;
  confidence: number;
  severity: "info" | "warning" | "critical";
  pointsDeducted: number;
  actionTaken?: string;
  metadata?: Record<string, any>;
}

export interface EnvironmentScanResult {
  passed: boolean;
  checks: EnvironmentCheck[];
  overallScore: number;
  recommendations: string[];
}

export interface EnvironmentCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  confidence: number;
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

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum VIOLATION_TYPES {
  LOOKING_AWAY = "looking_away",
  LOOKING_AWAY_EXTENDED = "looking_away_extended",
  FACE_NOT_CENTERED = "face_not_centered",
  POOR_LIGHTING = "poor_lighting",
  CAMERA_UNSTABLE = "camera_unstable",
  GAZE_DEVIATION = "gaze_deviation",
  HEAD_POSE_DEVIATION = "head_pose_deviation",

  MOBILE_PHONE = "mobile_phone",
  TABLET = "tablet",
  ADDITIONAL_PERSON = "additional_person",
  SUSPICIOUS_OBJECT = "suspicious_object",

  MULTIPLE_VOICES = "multiple_voices",
  BACKGROUND_NOISE = "background_noise",
  MIC_TAMPERING = "mic_tampering",

  TAB_SWITCH = "tab_switch",
  WINDOW_BLUR = "window_blur",
  FULLSCREEN_EXIT = "fullscreen_exit",
  COPY_PASTE = "copy_paste",
  KEYBOARD_SHORTCUT = "keyboard_shortcut",

  NO_FACE_DETECTED = "no_face_detected",
  MULTIPLE_FACES = "multiple_faces",

  ENV_CAMERA_FAIL = "env_camera_fail",
  ENV_MIC_FAIL = "env_mic_fail",
  ENV_LOW_BANDWIDTH = "env_low_bandwidth",
  ENV_UNSUPPORTED_BROWSER = "env_unsupported_browser",
}

// ─── Thresholds & Scoring ────────────────────────────────────────────────────

export const PROCTORING_THRESHOLDS = {
  DEFAULT_VIOLATION_LIMIT: 10,
  CRITICAL_VIOLATION_LIMIT: 5,
  WARNING_VIOLATION_LIMIT: 3,

  LOOKING_AWAY_POINTS: 1,
  LOOKING_AWAY_EXTENDED_POINTS: 2,
  TAB_SWITCH_POINTS: 1,
  WINDOW_BLUR_POINTS: 1,
  FULLSCREEN_EXIT_POINTS: 1,
  COPY_PASTE_POINTS: 2,
  KEYBOARD_SHORTCUT_POINTS: 1,
  MOBILE_PHONE_POINTS: 2,
  TABLET_POINTS: 2,
  ADDITIONAL_PERSON_POINTS: 3,
  SUSPICIOUS_OBJECT_POINTS: 2,
  MULTIPLE_VOICES_POINTS: 2,
  BACKGROUND_NOISE_POINTS: 1,
  MIC_TAMPERING_POINTS: 3,
  NO_FACE_POINTS: 3,
  MULTIPLE_FACES_POINTS: 3,
  FACE_NOT_CENTERED_POINTS: 1,
  POOR_LIGHTING_POINTS: 1,
  CAMERA_UNSTABLE_POINTS: 1,
  GAZE_DEVIATION_POINTS: 1,
  HEAD_POSE_DEVIATION_POINTS: 1,

  ENV_MIN_OVERALL_SCORE: 0.6,
  CONFIDENCE_THRESHOLD: 0.5,
  GAZE_THRESHOLD_DEGREES: 15,
  HEAD_POSE_THRESHOLD_DEGREES: 20,
  NOISE_THRESHOLD_DB: 45,
  LOOKING_AWAY_DURATION_MS: 5000,
} as const;

// ─── Point Mapping ───────────────────────────────────────────────────────────

const VIOLATION_POINTS: Record<string, number> = {
  [VIOLATION_TYPES.LOOKING_AWAY]: PROCTORING_THRESHOLDS.LOOKING_AWAY_POINTS,
  [VIOLATION_TYPES.LOOKING_AWAY_EXTENDED]: PROCTORING_THRESHOLDS.LOOKING_AWAY_EXTENDED_POINTS,
  [VIOLATION_TYPES.TAB_SWITCH]: PROCTORING_THRESHOLDS.TAB_SWITCH_POINTS,
  [VIOLATION_TYPES.WINDOW_BLUR]: PROCTORING_THRESHOLDS.WINDOW_BLUR_POINTS,
  [VIOLATION_TYPES.FULLSCREEN_EXIT]: PROCTORING_THRESHOLDS.FULLSCREEN_EXIT_POINTS,
  [VIOLATION_TYPES.COPY_PASTE]: PROCTORING_THRESHOLDS.COPY_PASTE_POINTS,
  [VIOLATION_TYPES.KEYBOARD_SHORTCUT]: PROCTORING_THRESHOLDS.KEYBOARD_SHORTCUT_POINTS,
  [VIOLATION_TYPES.MOBILE_PHONE]: PROCTORING_THRESHOLDS.MOBILE_PHONE_POINTS,
  [VIOLATION_TYPES.TABLET]: PROCTORING_THRESHOLDS.TABLET_POINTS,
  [VIOLATION_TYPES.ADDITIONAL_PERSON]: PROCTORING_THRESHOLDS.ADDITIONAL_PERSON_POINTS,
  [VIOLATION_TYPES.SUSPICIOUS_OBJECT]: PROCTORING_THRESHOLDS.SUSPICIOUS_OBJECT_POINTS,
  [VIOLATION_TYPES.MULTIPLE_VOICES]: PROCTORING_THRESHOLDS.MULTIPLE_VOICES_POINTS,
  [VIOLATION_TYPES.BACKGROUND_NOISE]: PROCTORING_THRESHOLDS.BACKGROUND_NOISE_POINTS,
  [VIOLATION_TYPES.MIC_TAMPERING]: PROCTORING_THRESHOLDS.MIC_TAMPERING_POINTS,
  [VIOLATION_TYPES.NO_FACE_DETECTED]: PROCTORING_THRESHOLDS.NO_FACE_POINTS,
  [VIOLATION_TYPES.MULTIPLE_FACES]: PROCTORING_THRESHOLDS.MULTIPLE_FACES_POINTS,
  [VIOLATION_TYPES.FACE_NOT_CENTERED]: PROCTORING_THRESHOLDS.FACE_NOT_CENTERED_POINTS,
  [VIOLATION_TYPES.POOR_LIGHTING]: PROCTORING_THRESHOLDS.POOR_LIGHTING_POINTS,
  [VIOLATION_TYPES.CAMERA_UNSTABLE]: PROCTORING_THRESHOLDS.CAMERA_UNSTABLE_POINTS,
  [VIOLATION_TYPES.GAZE_DEVIATION]: PROCTORING_THRESHOLDS.GAZE_DEVIATION_POINTS,
  [VIOLATION_TYPES.HEAD_POSE_DEVIATION]: PROCTORING_THRESHOLDS.HEAD_POSE_DEVIATION_POINTS,
};

// ─── Internal Helpers ────────────────────────────────────────────────────────

function resolveViolationType(type: string): VIOLATION_TYPES {
  const normalised = type.toUpperCase().replace(/-/g, "_") as keyof typeof VIOLATION_TYPES;
  return VIOLATION_TYPES[normalised] ?? VIOLATION_TYPES.SUSPICIOUS_OBJECT;
}

function resolvePoints(eventType: string): number {
  return VIOLATION_POINTS[eventType] ?? 1;
}

function mapSeverity(eventType: string, confidence: number): ProctoringAnalysis["severity"] {
  const points = resolvePoints(eventType);
  if (points >= 3 || confidence >= 0.85) return "critical";
  if (points >= 2 || confidence >= 0.7) return "warning";
  return "info";
}

function resolveCategory(eventType: string): ProctoringAnalysis["category"] {
  if (
    eventType.includes("face") ||
    eventType.includes("looking") ||
    eventType.includes("camera") ||
    eventType.includes("lighting") ||
    eventType.includes("gaze") ||
    eventType.includes("head_pose")
  )
    return "camera";
  if (
    eventType.includes("tab") ||
    eventType.includes("window") ||
    eventType.includes("fullscreen")
  )
    return "screen";
  if (
    eventType.includes("voice") ||
    eventType.includes("noise") ||
    eventType.includes("mic")
  )
    return "audio";
  if (
    eventType.includes("phone") ||
    eventType.includes("tablet") ||
    eventType.includes("person") ||
    eventType.includes("object")
  )
    return "object";
  if (
    eventType.includes("copy") ||
    eventType.includes("paste") ||
    eventType.includes("keyboard") ||
    eventType.includes("shortcut")
  )
    return "keyboard";
  return "camera";
}

// ─── Face Detection Analysis ─────────────────────────────────────────────────

interface FaceDetectionData {
  faces: Array<{
    detection: { score: number };
    landmarks?: any;
    expressions?: Record<string, number>;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
  frameWidth: number;
  frameHeight: number;
  timestamp: string;
  gaze?: { x: number; y: number; pitch: number; yaw: number };
  headPose?: { pitch: number; yaw: number; roll: number };
  lightingScore?: number;
  cameraStability?: number;
  duration?: number;
}

function analyzeFaceDetection(data: FaceDetectionData): ProctoringAnalysis[] {
  const results: ProctoringAnalysis[] = [];
  const { faces, frameWidth, frameHeight, gaze, headPose, lightingScore, cameraStability, duration } = data;

  if (!faces || faces.length === 0) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.NO_FACE_DETECTED,
      category: "camera",
      description: "No face detected in camera feed",
      confidence: 0.95,
      severity: "critical",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.NO_FACE_DETECTED],
      actionTaken: "alert_candidate",
    });
    return results;
  }

  if (faces.length > 1) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.MULTIPLE_FACES,
      category: "camera",
      description: `Multiple faces detected (${faces.length})`,
      confidence: Math.min(0.99, 0.7 + faces.length * 0.1),
      severity: "critical",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.MULTIPLE_FACES],
      actionTaken: "alert_candidate_and_flag",
      metadata: { faceCount: faces.length },
    });
  }

  const primaryFace = faces[0];
  const { boundingBox } = primaryFace;

  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;
  const frameCenterX = frameWidth / 2;
  const frameCenterY = frameHeight / 2;
  const offsetX = Math.abs(centerX - frameCenterX) / frameWidth;
  const offsetY = Math.abs(centerY - frameCenterY) / frameHeight;
  const centerOffset = Math.sqrt(offsetX ** 2 + offsetY ** 2);

  if (centerOffset > 0.25) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.FACE_NOT_CENTERED,
      category: "camera",
      description: "Face is not centered in the camera frame",
      confidence: Math.min(0.95, 0.5 + centerOffset),
      severity: "warning",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.FACE_NOT_CENTERED],
      metadata: { centerOffset, centerX, centerY },
    });
  }

  if (gaze) {
    const gazeDeviation = Math.sqrt(gaze.x ** 2 + gaze.y ** 2);
    if (gazeDeviation > PROCTORING_THRESHOLDS.GAZE_THRESHOLD_DEGREES) {
      results.push({
        isViolation: true,
        eventType: VIOLATION_TYPES.GAZE_DEVIATION,
        category: "camera",
        description: `Gaze deviated from screen (deviation: ${gazeDeviation.toFixed(1)} degrees)`,
        confidence: Math.min(0.95, 0.5 + gazeDeviation / 60),
        severity: gazeDeviation > 30 ? "critical" : "warning",
        pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.GAZE_DEVIATION],
        metadata: { gaze, deviation: gazeDeviation },
      });
    }

    const isLookingAway =
      Math.abs(gaze.x) > PROCTORING_THRESHOLDS.GAZE_THRESHOLD_DEGREES ||
      Math.abs(gaze.y) > PROCTORING_THRESHOLDS.GAZE_THRESHOLD_DEGREES;

    if (isLookingAway && duration && duration >= PROCTORING_THRESHOLDS.LOOKING_AWAY_DURATION_MS) {
      const extendedPoints = VIOLATION_POINTS[VIOLATION_TYPES.LOOKING_AWAY_EXTENDED];
      results.push({
        isViolation: true,
        eventType: VIOLATION_TYPES.LOOKING_AWAY_EXTENDED,
        category: "camera",
        description: `Candidate looking away for extended period (${(duration / 1000).toFixed(1)}s)`,
        confidence: 0.9,
        severity: "warning",
        pointsDeducted: extendedPoints,
        metadata: { durationMs: duration, gaze },
      });
    } else if (isLookingAway) {
      results.push({
        isViolation: true,
        eventType: VIOLATION_TYPES.LOOKING_AWAY,
        category: "camera",
        description: "Candidate briefly looked away from screen",
        confidence: 0.8,
        severity: "info",
        pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.LOOKING_AWAY],
        metadata: { gaze },
      });
    }
  }

  if (headPose) {
    const poseDeviation = Math.sqrt(headPose.pitch ** 2 + headPose.yaw ** 2);
    if (poseDeviation > PROCTORING_THRESHOLDS.HEAD_POSE_THRESHOLD_DEGREES) {
      results.push({
        isViolation: true,
        eventType: VIOLATION_TYPES.HEAD_POSE_DEVIATION,
        category: "camera",
        description: `Head pose deviation detected (pitch: ${headPose.pitch.toFixed(1)}°, yaw: ${headPose.yaw.toFixed(1)}°)`,
        confidence: Math.min(0.95, 0.5 + poseDeviation / 60),
        severity: poseDeviation > 35 ? "critical" : "warning",
        pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.HEAD_POSE_DEVIATION],
        metadata: { headPose, deviation: poseDeviation },
      });
    }
  }

  if (lightingScore !== undefined && lightingScore < 0.3) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.POOR_LIGHTING,
      category: "camera",
      description: `Poor lighting conditions detected (score: ${lightingScore.toFixed(2)})`,
      confidence: 1 - lightingScore,
      severity: "warning",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.POOR_LIGHTING],
      metadata: { lightingScore },
    });
  }

  if (cameraStability !== undefined && cameraStability < 0.4) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.CAMERA_UNSTABLE,
      category: "camera",
      description: "Camera appears unstable or is being moved",
      confidence: 1 - cameraStability,
      severity: "warning",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.CAMERA_UNSTABLE],
      metadata: { cameraStability },
    });
  }

  if (results.length === 0) {
    results.push({
      isViolation: false,
      eventType: "face_check_ok",
      category: "camera",
      description: "Face detection check passed",
      confidence: primaryFace.detection.score ?? 0.9,
      severity: "info",
      pointsDeducted: 0,
    });
  }

  return results;
}

// ─── Object Detection ────────────────────────────────────────────────────────

interface ObjectDetectionData {
  detections: Array<{
    label: string;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
  timestamp: string;
}

const SUSPICIOUS_LABELS: Record<string, VIOLATION_TYPES> = {
  cell_phone: VIOLATION_TYPES.MOBILE_PHONE,
  mobile_phone: VIOLATION_TYPES.MOBILE_PHONE,
  phone: VIOLATION_TYPES.MOBILE_PHONE,
  smartphone: VIOLATION_TYPES.MOBILE_PHONE,
  tablet: VIOLATION_TYPES.TABLET,
  ipad: VIOLATION_TYPES.TABLET,
  person: VIOLATION_TYPES.ADDITIONAL_PERSON,
  book: VIOLATION_TYPES.SUSPICIOUS_OBJECT,
  paper: VIOLATION_TYPES.SUSPICIOUS_OBJECT,
  headphones: VIOLATION_TYPES.SUSPICIOUS_OBJECT,
  earphone: VIOLATION_TYPES.SUSPICIOUS_OBJECT,
  earbuds: VIOLATION_TYPES.SUSPICIOUS_OBJECT,
};

function analyzeObjectDetection(data: ObjectDetectionData): ProctoringAnalysis[] {
  const results: ProctoringAnalysis[] = [];

  if (!data.detections || data.detections.length === 0) {
    return [
      {
        isViolation: false,
        eventType: "object_check_ok",
        category: "object",
        description: "No suspicious objects detected",
        confidence: 0.9,
        severity: "info",
        pointsDeducted: 0,
      },
    ];
  }

  for (const detection of data.detections) {
    const normalisedLabel = detection.label.toLowerCase().replace(/[\s-]/g, "_");
    const violationType = SUSPICIOUS_LABELS[normalisedLabel];

    if (violationType && detection.confidence >= PROCTORING_THRESHOLDS.CONFIDENCE_THRESHOLD) {
      const description =
        violationType === VIOLATION_TYPES.ADDITIONAL_PERSON
          ? "Additional person detected in frame"
          : `Suspicious object detected: ${detection.label}`;

      results.push({
        isViolation: true,
        eventType: violationType,
        category: "object",
        description,
        confidence: detection.confidence,
        severity: mapSeverity(violationType, detection.confidence),
        pointsDeducted: VIOLATION_POINTS[violationType],
        actionTaken: "alert_candidate_and_flag",
        metadata: { detection },
      });
    }
  }

  if (results.length === 0) {
    return [
      {
        isViolation: false,
        eventType: "object_check_ok",
        category: "object",
        description: "No suspicious objects detected above threshold",
        confidence: 0.85,
        severity: "info",
        pointsDeducted: 0,
      },
    ];
  }

  return results;
}

// ─── Audio Analysis ──────────────────────────────────────────────────────────

interface AudioAnalysisData {
  voiceCount?: number;
  noiseLevel?: number;
  isMicrophoneTampered?: boolean;
  audioFeatures?: {
    rms?: number;
    spectralCentroid?: number;
    zeroCrossingRate?: number;
  };
  timestamp: string;
}

function analyzeAudioData(data: AudioAnalysisData): ProctoringAnalysis[] {
  const results: ProctoringAnalysis[] = [];

  if (data.voiceCount !== undefined && data.voiceCount > 1) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.MULTIPLE_VOICES,
      category: "audio",
      description: `Multiple voices detected (${data.voiceCount})`,
      confidence: Math.min(0.95, 0.6 + data.voiceCount * 0.1),
      severity: "critical",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.MULTIPLE_VOICES],
      actionTaken: "alert_candidate",
      metadata: { voiceCount: data.voiceCount },
    });
  }

  if (data.noiseLevel !== undefined && data.noiseLevel > PROCTORING_THRESHOLDS.NOISE_THRESHOLD_DB) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.BACKGROUND_NOISE,
      category: "audio",
      description: `High background noise detected (${data.noiseLevel.toFixed(1)} dB)`,
      confidence: Math.min(0.95, (data.noiseLevel - PROCTORING_THRESHOLDS.NOISE_THRESHOLD_DB) / 40 + 0.5),
      severity: data.noiseLevel > 65 ? "critical" : "warning",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.BACKGROUND_NOISE],
      metadata: { noiseLevel: data.noiseLevel },
    });
  }

  if (data.isMicrophoneTampered) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.MIC_TAMPERING,
      category: "audio",
      description: "Microphone tampering or unusual audio pattern detected",
      confidence: 0.85,
      severity: "critical",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.MIC_TAMPERING],
      actionTaken: "alert_candidate_and_flag",
    });
  }

  if (results.length === 0) {
    return [
      {
        isViolation: false,
        eventType: "audio_check_ok",
        category: "audio",
        description: "Audio analysis check passed",
        confidence: 0.9,
        severity: "info",
        pointsDeducted: 0,
      },
    ];
  }

  return results;
}

// ─── Screen Monitoring ───────────────────────────────────────────────────────

interface ScreenMonitoringData {
  tabSwitchCount?: number;
  windowBlurCount?: number;
  fullscreenExitCount?: number;
  copyPasteAttempts?: number;
  blockedShortcutsUsed?: string[];
  tabSwitchDetails?: Array<{ timestamp: string; duration: number }>;
  timestamp: string;
}

function analyzeScreenData(data: ScreenMonitoringData): ProctoringAnalysis[] {
  const results: ProctoringAnalysis[] = [];

  if (data.tabSwitchCount !== undefined && data.tabSwitchCount > 0) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.TAB_SWITCH,
      category: "screen",
      description: `Tab switching detected (${data.tabSwitchCount} time${data.tabSwitchCount > 1 ? "s" : ""})`,
      confidence: 0.99,
      severity: "warning",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.TAB_SWITCH] * data.tabSwitchCount,
      actionTaken: "alert_candidate_and_flag",
      metadata: {
        count: data.tabSwitchCount,
        details: data.tabSwitchDetails,
      },
    });
  }

  if (data.windowBlurCount !== undefined && data.windowBlurCount > 0) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.WINDOW_BLUR,
      category: "screen",
      description: `Window blur events detected (${data.windowBlurCount})`,
      confidence: 0.95,
      severity: "warning",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.WINDOW_BLUR] * data.windowBlurCount,
      metadata: { count: data.windowBlurCount },
    });
  }

  if (data.fullscreenExitCount !== undefined && data.fullscreenExitCount > 0) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.FULLSCREEN_EXIT,
      category: "screen",
      description: `Fullscreen exit detected (${data.fullscreenExitCount} time${data.fullscreenExitCount > 1 ? "s" : ""})`,
      confidence: 0.99,
      severity: "critical",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.FULLSCREEN_EXIT] * data.fullscreenExitCount,
      actionTaken: "alert_candidate_and_flag",
      metadata: { count: data.fullscreenExitCount },
    });
  }

  if (data.copyPasteAttempts !== undefined && data.copyPasteAttempts > 0) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.COPY_PASTE,
      category: "keyboard",
      description: `Copy/paste attempt detected (${data.copyPasteAttempts})`,
      confidence: 0.99,
      severity: "critical",
      pointsDeducted: VIOLATION_POINTS[VIOLATION_TYPES.COPY_PASTE] * data.copyPasteAttempts,
      actionTaken: "flag_for_review",
      metadata: { count: data.copyPasteAttempts },
    });
  }

  if (data.blockedShortcutsUsed && data.blockedShortcutsUsed.length > 0) {
    results.push({
      isViolation: true,
      eventType: VIOLATION_TYPES.KEYBOARD_SHORTCUT,
      category: "keyboard",
      description: `Blocked keyboard shortcuts used: ${data.blockedShortcutsUsed.join(", ")}`,
      confidence: 0.99,
      severity: "warning",
      pointsDeducted:
        VIOLATION_POINTS[VIOLATION_TYPES.KEYBOARD_SHORTCUT] * data.blockedShortcutsUsed.length,
      metadata: { shortcuts: data.blockedShortcutsUsed },
    });
  }

  if (results.length === 0) {
    return [
      {
        isViolation: false,
        eventType: "screen_check_ok",
        category: "screen",
        description: "Screen monitoring check passed",
        confidence: 0.95,
        severity: "info",
        pointsDeducted: 0,
      },
    ];
  }

  return results;
}

// ─── Main Entry: Analyze Proctoring Event ────────────────────────────────────

export function analyzeProctoringEvent(
  type: "face" | "object" | "audio" | "screen",
  data: Record<string, any>
): ProctoringAnalysis[] {
  try {
    switch (type) {
      case "face":
        return analyzeFaceDetection(data as unknown as FaceDetectionData);
      case "object":
        return analyzeObjectDetection(data as unknown as ObjectDetectionData);
      case "audio":
        return analyzeAudioData(data as unknown as AudioAnalysisData);
      case "screen":
        return analyzeScreenData(data as unknown as ScreenMonitoringData);
      default:
        return [
          {
            isViolation: false,
            eventType: "unknown_event_type",
            category: "camera",
            description: `Unknown proctoring event type: ${type}`,
            confidence: 0,
            severity: "info",
            pointsDeducted: 0,
          },
        ];
    }
  } catch (error) {
    console.error(`[Proctoring] Error analyzing ${type} event:`, error);
    return [
      {
        isViolation: false,
        eventType: "analysis_error",
        category: "camera",
        description: `Failed to analyze ${type} event`,
        confidence: 0,
        severity: "info",
        pointsDeducted: 0,
        metadata: { error: (error as Error).message },
      },
    ];
  }
}

// ─── Violation Score Calculator ──────────────────────────────────────────────

interface EventRecord {
  eventType: string;
  timestamp: string;
  pointsDeducted: number;
  severity: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export function calculateViolationScore(
  events: EventRecord[],
  threshold: number = PROCTORING_THRESHOLDS.DEFAULT_VIOLATION_LIMIT
): { totalPoints: number; thresholdReached: boolean; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let totalPoints = 0;

  for (const event of events) {
    if (event.pointsDeducted > 0) {
      totalPoints += event.pointsDeducted;
      breakdown[event.eventType] = (breakdown[event.eventType] || 0) + event.pointsDeducted;
    }
  }

  return {
    totalPoints,
    thresholdReached: totalPoints >= threshold,
    breakdown,
  };
}

// ─── Violation Report Generator ──────────────────────────────────────────────

export function generateViolationReport(
  sessionId: string,
  events: EventRecord[],
  threshold: number = PROCTORING_THRESHOLDS.DEFAULT_VIOLATION_LIMIT
): ViolationReport {
  const { totalPoints, thresholdReached, breakdown } = calculateViolationScore(events, threshold);

  const violations: ViolationSummary[] = Object.entries(breakdown)
    .map(([type, totalPts]) => ({
      type,
      count: events.filter((e) => e.eventType === type && e.pointsDeducted > 0).length,
      totalPoints: totalPts,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const timeline: ViolationTimelineEntry[] = events
    .filter((e) => e.pointsDeducted > 0)
    .map((e) => ({
      timestamp: e.timestamp,
      eventType: e.eventType,
      description: buildViolationDescription(e),
      severity: e.severity,
      pointsDeducted: e.pointsDeducted,
      screenshotData: e.metadata?.screenshotData as string | undefined,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let recommendation: string;
  if (totalPoints >= PROCTORING_THRESHOLDS.CRITICAL_VIOLATION_LIMIT * 2) {
    recommendation =
      "CRITICAL: Interview integrity severely compromised. Immediate review recommended. Candidate flagged for manual assessment.";
  } else if (thresholdReached) {
    recommendation =
      "HIGH RISK: Violation threshold exceeded. The interview should be reviewed by an administrator before results are considered valid.";
  } else if (totalPoints >= PROCTORING_THRESHOLDS.WARNING_VIOLATION_LIMIT) {
    recommendation =
      "MODERATE: Several minor violations detected. Consider reviewing the interview recording for context.";
  } else if (totalPoints > 0) {
    recommendation =
      "LOW RISK: Minor violations detected but within acceptable limits. Interview results can be considered with standard review.";
  } else {
    recommendation =
      "CLEAN: No violations detected. Interview was conducted within all proctoring guidelines.";
  }

  return {
    totalViolations: violations.reduce((sum, v) => sum + v.count, 0),
    totalPoints,
    threshold,
    thresholdReached,
    violations,
    timeline,
    recommendation,
  };
}

function buildViolationDescription(event: EventRecord): string {
  const mapping: Record<string, (e: EventRecord) => string> = {
    [VIOLATION_TYPES.LOOKING_AWAY]: () => "Candidate looked away from screen",
    [VIOLATION_TYPES.LOOKING_AWAY_EXTENDED]: () =>
      `Candidate looked away for extended period${event.metadata?.durationMs ? ` (${((event.metadata.durationMs as number) / 1000).toFixed(1)}s)` : ""}`,
    [VIOLATION_TYPES.TAB_SWITCH]: () =>
      `Tab switching detected${event.metadata?.count ? ` (${event.metadata.count} times)` : ""}`,
    [VIOLATION_TYPES.WINDOW_BLUR]: () =>
      `Window focus lost${event.metadata?.count ? ` (${event.metadata.count} times)` : ""}`,
    [VIOLATION_TYPES.FULLSCREEN_EXIT]: () => "Candidate exited fullscreen mode",
    [VIOLATION_TYPES.COPY_PASTE]: () => "Copy/paste attempt detected",
    [VIOLATION_TYPES.KEYBOARD_SHORTCUT]: () =>
      `Blocked keyboard shortcut used${event.metadata?.shortcuts ? `: ${(event.metadata.shortcuts as string[]).join(", ")}` : ""}`,
    [VIOLATION_TYPES.MOBILE_PHONE]: () => "Mobile phone detected in camera frame",
    [VIOLATION_TYPES.TABLET]: () => "Tablet detected in camera frame",
    [VIOLATION_TYPES.ADDITIONAL_PERSON]: () => "Additional person detected in frame",
    [VIOLATION_TYPES.SUSPICIOUS_OBJECT]: () => "Suspicious object detected",
    [VIOLATION_TYPES.MULTIPLE_VOICES]: () =>
      `Multiple voices detected${event.metadata?.voiceCount ? ` (${event.metadata.voiceCount})` : ""}`,
    [VIOLATION_TYPES.BACKGROUND_NOISE]: () => "High background noise detected",
    [VIOLATION_TYPES.MIC_TAMPERING]: () => "Microphone tampering detected",
    [VIOLATION_TYPES.NO_FACE_DETECTED]: () => "No face detected in camera",
    [VIOLATION_TYPES.MULTIPLE_FACES]: () =>
      `Multiple faces detected${event.metadata?.faceCount ? ` (${event.metadata.faceCount})` : ""}`,
    [VIOLATION_TYPES.FACE_NOT_CENTERED]: () => "Face not centered in camera frame",
    [VIOLATION_TYPES.POOR_LIGHTING]: () => "Poor lighting conditions",
    [VIOLATION_TYPES.CAMERA_UNSTABLE]: () => "Camera appears unstable",
    [VIOLATION_TYPES.GAZE_DEVIATION]: () => "Gaze direction deviated from screen",
    [VIOLATION_TYPES.HEAD_POSE_DEVIATION]: () => "Head pose deviation detected",
  };

  const builder = mapping[event.eventType];
  return builder ? builder(event) : `Violation: ${event.eventType}`;
}

// ─── Environment Scan (AI-powered) ───────────────────────────────────────────

interface EnvironmentScanData {
  browserInfo: {
    name: string;
    version: string;
    userAgent: string;
  };
  cameraAvailable: boolean;
  cameraResolution?: string;
  microphoneAvailable: boolean;
  microphoneLabel?: string;
  screenResolution: string;
  windowSize: { width: number; height: number };
  connectionType?: string;
  connectionSpeed?: number;
  osInfo: string;
  supportedFeatures: string[];
  hasWebRTC: boolean;
  hasGetUserMedia: boolean;
  timestamp: string;
}

const FALLBACK_ENVIRONMENT_RESULT: EnvironmentScanResult = {
  passed: false,
  checks: [
    {
      name: "analysis_error",
      status: "fail",
      message: "Could not perform environment analysis",
      confidence: 0,
    },
  ],
  overallScore: 0,
  recommendations: [
    "Please try again or contact support if the issue persists.",
  ],
};

export async function analyzeEnvironmentScan(
  scanData: EnvironmentScanData
): Promise<EnvironmentScanResult> {
  const checks: EnvironmentCheck[] = [];
  let totalScore = 0;

  // Rule-based checks (always run, instant)
  if (scanData.cameraAvailable) {
    checks.push({ name: "camera", status: "pass", message: "Camera is available", confidence: 1 });
    totalScore += 0.2;
  } else {
    checks.push({ name: "camera", status: "fail", message: "Camera is not available or not permitted", confidence: 1 });
  }

  if (scanData.microphoneAvailable) {
    checks.push({ name: "microphone", status: "pass", message: "Microphone is available", confidence: 1 });
    totalScore += 0.2;
  } else {
    checks.push({ name: "microphone", status: "fail", message: "Microphone is not available or not permitted", confidence: 1 });
  }

  const unsupportedBrowser =
    !scanData.hasWebRTC || !scanData.hasGetUserMedia;
  if (unsupportedBrowser) {
    checks.push({
      name: "browser_support",
      status: "fail",
      message: "Browser does not fully support required features (WebRTC / getUserMedia)",
      confidence: 0.95,
    });
  } else {
    checks.push({ name: "browser_support", status: "pass", message: "Browser supports required features", confidence: 0.95 });
    totalScore += 0.2;
  }

  if (scanData.screenResolution) {
    const [width] = scanData.screenResolution.split("x").map(Number);
    if (width >= 1280) {
      checks.push({ name: "screen_resolution", status: "pass", message: `Resolution ${scanData.screenResolution} is adequate`, confidence: 0.9 });
      totalScore += 0.1;
    } else {
      checks.push({ name: "screen_resolution", status: "warning", message: `Low screen resolution: ${scanData.screenResolution}`, confidence: 0.8 });
      totalScore += 0.05;
    }
  }

  if (scanData.connectionSpeed !== undefined) {
    if (scanData.connectionSpeed >= 5) {
      checks.push({ name: "bandwidth", status: "pass", message: `Connection speed: ${scanData.connectionSpeed} Mbps`, confidence: 0.85 });
      totalScore += 0.15;
    } else if (scanData.connectionSpeed >= 2) {
      checks.push({ name: "bandwidth", status: "warning", message: `Moderate connection speed: ${scanData.connectionSpeed} Mbps`, confidence: 0.85 });
      totalScore += 0.08;
    } else {
      checks.push({ name: "bandwidth", status: "fail", message: `Low connection speed: ${scanData.connectionSpeed} Mbps`, confidence: 0.85 });
    }
  }

  // AI-powered deeper analysis
  const systemPrompt = `You are an interview proctoring environment analyst. Analyze the candidate's system environment and return a JSON object with exactly this shape:
{
  "checks": [{ "name": string, "status": "pass" | "fail" | "warning", "message": string, "confidence": number (0-1) }],
  "overallScore": number (0-1),
  "recommendations": string[]
}
Focus on: potential cheating vectors, software that could aid cheating (VMs, remote desktop, screen sharing tools), browser extensions, OS-level concerns, and overall readiness for a secure interview session.`;

  const userPrompt = `Environment scan data:
- Browser: ${scanData.browserInfo.name} ${scanData.browserInfo.version}
- OS: ${scanData.osInfo}
- Screen: ${scanData.screenResolution}
- Window: ${scanData.windowSize.width}x${scanData.windowSize.height}
- Connection type: ${scanData.connectionType ?? "unknown"}
- Connection speed: ${scanData.connectionSpeed ?? "unknown"} Mbps
- Supported features: ${scanData.supportedFeatures.join(", ")}
- Has WebRTC: ${scanData.hasWebRTC}
- Has getUserMedia: ${scanData.hasGetUserMedia}
- Camera available: ${scanData.cameraAvailable}
- Camera resolution: ${scanData.cameraResolution ?? "unknown"}
- Microphone available: ${scanData.microphoneAvailable}
- Microphone label: ${scanData.microphoneLabel ?? "unknown"}

Return ONLY valid JSON.`;

  const aiResult = await generateJSON<{
    checks: EnvironmentCheck[];
    overallScore: number;
    recommendations: string[];
  }>(
    systemPrompt,
    userPrompt,
    { model: MODELS.FAST, temperature: 0.2, maxTokens: 1024 },
    FALLBACK_ENVIRONMENT_RESULT
  );

  // Merge rule-based and AI checks
  if (aiResult.checks && Array.isArray(aiResult.checks)) {
    const aiCheckNames = new Set(aiResult.checks.map((c) => c.name));
    for (const ruleCheck of checks) {
      if (!aiCheckNames.has(ruleCheck.name)) {
        aiResult.checks.push(ruleCheck);
      }
    }
    checks.length = 0;
    checks.push(...aiResult.checks);
  }

  // Recalculate merged score
  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const aiScore = aiResult.overallScore ?? 0;
  const ruleScore = totalScore;
  const mergedScore = (aiScore + ruleScore) / 2;

  const finalScore = checks.length > 0
    ? Math.min(1, mergedScore + (passCount * 0.05) - (failCount * 0.1) - (warningCount * 0.03))
    : 0;

  const passed = failCount === 0 && finalScore >= PROCTORING_THRESHOLDS.ENV_MIN_OVERALL_SCORE;

  const recommendations = [
    ...(aiResult.recommendations ?? []),
  ];

  if (failCount > 0) {
    recommendations.unshift(
      "Resolve all critical failures before starting the interview."
    );
  }
  if (scanData.connectionSpeed !== undefined && scanData.connectionSpeed < 2) {
    recommendations.push("Use a more stable internet connection if possible.");
  }

  return {
    passed,
    checks,
    overallScore: Math.round(finalScore * 100) / 100,
    recommendations: [...new Set(recommendations)],
  };
}

// ─── Severity Mapper ─────────────────────────────────────────────────────────

export function getViolationSeverity(
  eventType: string,
  confidence: number
): "info" | "warning" | "critical" {
  const resolved = resolveViolationType(eventType);
  return mapSeverity(resolved, confidence);
}
