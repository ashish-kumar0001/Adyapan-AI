import { StreakService } from "../../src/services/streak.service";

describe("StreakService.getLocalDateString", () => {
  it("formats a date as YYYY-MM-DD in UTC by default", () => {
    const d = new Date("2024-03-05T10:30:00Z");
    expect(StreakService.getLocalDateString(d)).toBe("2024-03-05");
  });

  it("zero-pads month and day", () => {
    const d = new Date("2024-01-09T00:00:00Z");
    expect(StreakService.getLocalDateString(d, "UTC")).toBe("2024-01-09");
  });

  it("respects a positive-offset timezone crossing midnight", () => {
    // 23:30 UTC is already the next calendar day in Kolkata (+05:30).
    const d = new Date("2024-06-30T23:30:00Z");
    expect(StreakService.getLocalDateString(d, "Asia/Kolkata")).toBe("2024-07-01");
  });

  it("respects a negative-offset timezone staying on the previous day", () => {
    // 02:00 UTC is still the previous day in New York (-04:00/-05:00).
    const d = new Date("2024-06-30T02:00:00Z");
    expect(StreakService.getLocalDateString(d, "America/New_York")).toBe("2024-06-29");
  });

  it("falls back to the UTC ISO date when the timezone is invalid", () => {
    const d = new Date("2024-12-25T12:00:00Z");
    expect(StreakService.getLocalDateString(d, "Not/AZone")).toBe("2024-12-25");
  });
});
