export interface MetricEntry {
  timestamp: Date;
  type: "api" | "db" | "ai" | "upload" | "error";
  name: string;
  durationMs: number;
  metadata?: any;
}

export class PerformanceMonitor {
  private static entries: MetricEntry[] = [];
  private static MAX_ENTRIES = 1000;

  static record(type: MetricEntry["type"], name: string, durationMs: number, metadata?: any) {
    this.entries.push({
      timestamp: new Date(),
      type,
      name,
      durationMs,
      metadata,
    });
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift();
    }
  }

  static getStats() {
    const now = Date.now();
    const last24h = this.entries.filter(
      (e) => now - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const calculateAvg = (type: MetricEntry["type"]) => {
      const typeEntries = last24h.filter((e) => e.type === type);
      if (typeEntries.length === 0) return 0;
      return Math.round(
        typeEntries.reduce((sum, e) => sum + e.durationMs, 0) / typeEntries.length
      );
    };

    const countErrors = last24h.filter((e) => e.type === "error").length;
    const totalRequests = last24h.filter((e) => e.type === "api").length;

    return {
      avgApiResponseTime: calculateAvg("api"),
      avgDatabaseQueryTime: calculateAvg("db"),
      avgAiGenerationTime: calculateAvg("ai"),
      avgUploadTime: calculateAvg("upload"),
      errorRate: totalRequests > 0 ? Number(((countErrors / totalRequests) * 100).toFixed(2)) : 0,
      totalRequests,
      totalErrors: countErrors,
      recentMetrics: last24h.slice(-20), // last 20 events
    };
  }
}
