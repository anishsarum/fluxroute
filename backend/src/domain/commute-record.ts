import type { CommuteDurations } from "./commute-duration.js";
import type { RouteSettings } from "./route-settings.js";

export type CaptureSource = "scheduled" | "manual";

export type NewCommuteRecord = {
  capturedAt: Date;
  captureSource: CaptureSource;
  durationInTraffic: number;
  staticDuration: number;
  originLabel: string;
  originLatitude: number;
  originLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
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
  routeSettings: RouteSettings,
  observedAt: Date,
  captureSource: CaptureSource
): NewCommuteRecord {
  return {
    capturedAt: observedAt,
    captureSource,
    durationInTraffic: durations.durationInTraffic,
    staticDuration: durations.staticDuration,
    originLabel: routeSettings.origin.label,
    originLatitude: routeSettings.origin.latitude,
    originLongitude: routeSettings.origin.longitude,
    destinationLabel: routeSettings.destination.label,
    destinationLatitude: routeSettings.destination.latitude,
    destinationLongitude: routeSettings.destination.longitude,
    dayOfWeek: getDayOfWeek(observedAt)
  };
}
