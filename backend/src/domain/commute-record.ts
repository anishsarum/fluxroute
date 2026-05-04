import type { CommuteDurations } from "./commute-duration.js";

export type CaptureSource = "scheduled" | "manual";

export type NewCommuteRecord = {
  capturedAt: Date;
  captureSource: CaptureSource;
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
  observedAt: Date,
  captureSource: CaptureSource
): NewCommuteRecord {
  return {
    capturedAt: observedAt,
    captureSource,
    durationInTraffic: durations.durationInTraffic,
    staticDuration: durations.staticDuration,
    dayOfWeek: getDayOfWeek(observedAt)
  };
}
