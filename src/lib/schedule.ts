import { TIMEZONE } from "./format";

const pad = (n: number) => String(n).padStart(2, "0");

/** Cairo wall-clock parts for an instant. */
export function cairoParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** "2026-10-11" + "18:30" in Cairo -> UTC Date (handles Egypt's DST). */
export function cairoToDate(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  // Offset of Cairo at that moment, e.g. "GMT+03:00"
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, timeZoneName: "longOffset" }).formatToParts(guess).find((p) => p.type === "timeZoneName")!.value;
  const m = name.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  const offsetMin = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
  return new Date(guess.getTime() - offsetMin * 60_000);
}

export type ScheduleConfig = { schedule_days_ahead: number; schedule_start: string; schedule_end: string };
export const MIN_LEAD_MINUTES = 60;

/** Available days and 30-minute slots (Cairo time), skipping anything sooner than the lead time. */
export function availableSlots(cfg: ScheduleConfig, now = new Date()) {
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60_000;
  const [sh, sm] = cfg.schedule_start.split(":").map(Number);
  const [eh, em] = cfg.schedule_end.split(":").map(Number);
  const today = cairoParts(now).date;
  const days: { date: string; times: string[] }[] = [];
  for (let d = 0; d <= cfg.schedule_days_ahead; d++) {
    const date = cairoParts(new Date(cairoToDate(today, "12:00").getTime() + d * 86_400_000)).date;
    const times: string[] = [];
    for (let m = sh * 60 + sm; m <= eh * 60 + em; m += 30) {
      const time = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
      if (cairoToDate(date, time).getTime() >= earliest) times.push(time);
    }
    if (times.length) days.push({ date, times });
  }
  return days;
}

export function isValidSlot(cfg: ScheduleConfig, date: string, time: string, now = new Date()) {
  return availableSlots(cfg, now).some((d) => d.date === date && d.times.includes(time));
}
