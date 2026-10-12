import { describe, expect, it } from "vitest";
import { availableSlots, cairoToDate, isValidSlot } from "./schedule";

describe("cairoToDate", () => {
  it("handles winter (UTC+2) and summer DST (UTC+3)", () => {
    expect(cairoToDate("2026-01-15", "10:00").toISOString()).toBe("2026-01-15T08:00:00.000Z");
    expect(cairoToDate("2026-07-15", "10:00").toISOString()).toBe("2026-07-15T07:00:00.000Z");
  });
});

describe("availableSlots", () => {
  const cfg = { schedule_days_ahead: 1, schedule_start: "10:00", schedule_end: "12:00" };
  it("skips slots inside the lead time and lists the next day", () => {
    const now = new Date("2026-01-15T08:20:00Z"); // 10:20 Cairo
    const days = availableSlots(cfg, now);
    expect(days[0]).toEqual({ date: "2026-01-15", times: ["11:30", "12:00"] });
    expect(days[1].date).toBe("2026-01-16");
    expect(days[1].times).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00"]);
  });
  it("validates", () => {
    const now = new Date("2026-01-15T08:20:00Z");
    expect(isValidSlot(cfg, "2026-01-16", "10:30", now)).toBe(true);
    expect(isValidSlot(cfg, "2026-01-15", "10:30", now)).toBe(false);
    expect(isValidSlot(cfg, "2026-01-17", "10:30", now)).toBe(false);
  });
});
