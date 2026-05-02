export type CommuteDurations = {
  durationInTraffic: number;
  staticDuration: number;
};

export function parseGoogleDuration(duration: string | undefined): number {
  if (!duration) {
    throw new Error("Google Routes API response did not include a duration");
  }

  const seconds = Number(duration.replace(/s$/, ""));

  if (!Number.isFinite(seconds)) {
    throw new Error(`Could not parse Google duration value: ${duration}`);
  }

  return Math.round(seconds / 60);
}
