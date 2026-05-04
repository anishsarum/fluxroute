import { describe, expect, it } from "vitest";
import { buildCommuteRecord, getDayOfWeek } from "./commute-record.js";

describe("getDayOfWeek", () => {
  it("returns the weekday name for a date", () => {
    expect(getDayOfWeek(new Date("2026-05-04T08:00:00.000Z"))).toBe("Monday");
  });
});

describe("buildCommuteRecord", () => {
  it("builds a commute record from route durations and observation time", () => {
    expect(
      buildCommuteRecord(
        {
          durationInTraffic: 42,
          staticDuration: 31
        },
        {
          origin: { label: "Home", latitude: 51.5, longitude: -0.12 },
          destination: { label: "Office", latitude: 51.45, longitude: -2.58 }
        },
        new Date("2026-05-05T08:00:00.000Z"),
        "manual"
      )
    ).toEqual({
      capturedAt: new Date("2026-05-05T08:00:00.000Z"),
      captureSource: "manual",
      durationInTraffic: 42,
      staticDuration: 31,
      originLabel: "Home",
      originLatitude: 51.5,
      originLongitude: -0.12,
      destinationLabel: "Office",
      destinationLatitude: 51.45,
      destinationLongitude: -2.58,
      dayOfWeek: "Tuesday"
    });
  });
});
