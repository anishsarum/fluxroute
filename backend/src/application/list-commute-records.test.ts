import { describe, expect, it, vi } from "vitest";
import {
  ListCommuteRecords,
  normalizeCaptureSourceFilter,
  normalizeLimit
} from "./list-commute-records.js";
import type { CommuteRecordReader } from "./list-commute-records.js";

describe("normalizeLimit", () => {
  it("defaults invalid limits", () => {
    expect(normalizeLimit(0)).toBe(100);
    expect(normalizeLimit(1.5)).toBe(100);
    expect(normalizeLimit(Number.NaN)).toBe(100);
  });

  it("caps large limits", () => {
    expect(normalizeLimit(999)).toBe(500);
  });
});

describe("normalizeCaptureSourceFilter", () => {
  it("defaults unknown values to scheduled", () => {
    expect(normalizeCaptureSourceFilter(undefined)).toBe("scheduled");
    expect(normalizeCaptureSourceFilter("surprise")).toBe("scheduled");
  });

  it("keeps supported filter values", () => {
    expect(normalizeCaptureSourceFilter("manual")).toBe("manual");
    expect(normalizeCaptureSourceFilter("all")).toBe("all");
  });
});

describe("ListCommuteRecords", () => {
  it("returns frontend-friendly commute record views", async () => {
    const recordReader: CommuteRecordReader = {
      listRecent: vi.fn().mockResolvedValue([
        {
          id: 1,
          createdAt: new Date("2026-05-01T07:30:00.000Z"),
          capturedAt: new Date("2026-05-01T07:29:58.000Z"),
          captureSource: "scheduled",
          durationInTraffic: 35,
          staticDuration: 25,
          originLabel: "Home",
          originLatitude: 51.5,
          originLongitude: -0.12,
          destinationLabel: "Office",
          destinationLatitude: 51.45,
          destinationLongitude: -2.58,
          dayOfWeek: "Friday"
        }
      ])
    };
    const useCase = new ListCommuteRecords(recordReader);

    await expect(useCase.execute(10)).resolves.toEqual([
      {
        id: 1,
        createdAt: "2026-05-01T07:30:00.000Z",
        capturedAt: "2026-05-01T07:29:58.000Z",
        captureSource: "scheduled",
        durationInTraffic: 35,
        staticDuration: 25,
        delay: 10,
        originLabel: "Home",
        originLatitude: 51.5,
        originLongitude: -0.12,
        destinationLabel: "Office",
        destinationLatitude: 51.45,
        destinationLongitude: -2.58,
        dayOfWeek: "Friday"
      }
    ]);
    expect(recordReader.listRecent).toHaveBeenCalledWith(10, "scheduled");
  });

  it("passes capture source filters to the reader", async () => {
    const recordReader: CommuteRecordReader = {
      listRecent: vi.fn().mockResolvedValue([])
    };
    const useCase = new ListCommuteRecords(recordReader);

    await useCase.execute(10, "manual");

    expect(recordReader.listRecent).toHaveBeenCalledWith(10, "manual");
  });
});
