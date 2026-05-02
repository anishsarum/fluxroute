import type { CommuteDurations } from "./commute-duration.js";

export type NewCommuteRecord = {
  durationInTraffic: number;
  staticDuration: number;
  dayOfWeek: string;
};

export type SavedCommuteRecord = NewCommuteRecord & {
  id: number;
  createdAt: Date;
};

export function getDayOfWeek(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

export function buildCommuteRecord(
  durations: CommuteDurations,
  observedAt: Date
): NewCommuteRecord {
  return {
    durationInTraffic: durations.durationInTraffic,
    staticDuration: durations.staticDuration,
    dayOfWeek: getDayOfWeek(observedAt)
  };
}
