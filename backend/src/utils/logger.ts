import fs from "fs";
import path from "path";

export interface LogEntry {
  timestamp: string;
  userId?: string;
  module: string;
  errorType: string;
  message: string;
  stackTrace?: string;
}

const LOGS_DIR = path.join(__dirname, "../../../logs");
const LOG_FILE = path.join(LOGS_DIR, "platform_errors.json");

export class PlatformLogger {
  static logError(entry: Omit<LogEntry, "timestamp">) {
    const fullEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // 1. Log to console
    console.error(`[PlatformError] [${fullEntry.module}] [${fullEntry.errorType}] ${fullEntry.message}`, fullEntry.stackTrace || "");

    // 2. Append to logs file
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }

      let logs: LogEntry[] = [];
      if (fs.existsSync(LOG_FILE)) {
        try {
          const content = fs.readFileSync(LOG_FILE, "utf-8");
          logs = JSON.parse(content);
          if (!Array.isArray(logs)) logs = [];
        } catch {
          logs = [];
        }
      }

      logs.push(fullEntry);

      // Keep only last 1000 logs to prevent file bloat
      if (logs.length > 1000) {
        logs = logs.slice(logs.length - 1000);
      }

      fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
    } catch (writeErr) {
      console.error("[PlatformLogger] Failed to write to log file:", writeErr);
    }
  }
}
