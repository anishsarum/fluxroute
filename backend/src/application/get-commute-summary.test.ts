import { describe, expect, it, vi } from "vitest";
import { GetCommuteSummary } from "./get-commute-summary.js";
import type { CommuteRecordReader } from "./list-commute-records.js";

describe("GetCommuteSummary", () => {
  it("summarizes records by weekday", async () => {
    const recordReader: CommuteRecordReader = {
      listRecent: vi.fn().mockResolvedValue([
        {
          id: 1,
          createdAt: new Date("2026-05-04T07:30:00.000Z"),
          durationInTraffic: 40,
          staticDuration: 30,
          dayOfWeek: "Monday"
        },
        {
          id: 2,
          createdAt: new Date("2026-05-11T07:30:00.000Z"),
          durationInTraffic: 44,
          staticDuration: 28,
          dayOfWeek: "Monday"
        },
        {
          id: 3,
          createdAt: new Date("2026-05-05T07:30:00.000Z"),
          durationInTraffic: 33,
          staticDuration: 30,
          dayOfWeek: "Tuesday"
        }
      ])
    };
    const useCase = new GetCommuteSummary(recordReader);

    await expect(useCase.execute()).resolves.toMatchObject({
      sampleSize: 3,
      weekdayAverages: [
        {
          dayOfWeek: "Monday",
          averageDurationInTraffic: 42,
          averageStaticDuration: 29,
          averageDelay: 13,
          sampleSize: 2
        },
        {
          dayOfWeek: "Tuesday",
          averageDurationInTraffic: 33,
          averageStaticDuration: 30,
          averageDelay: 3,
          sampleSize: 1
        }
      ]
    });
    expect(recordReader.listRecent).toHaveBeenCalledWith(500);
  });
});
