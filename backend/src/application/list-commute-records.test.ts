import { describe, expect, it, vi } from "vitest";
import { ListCommuteRecords, normalizeLimit } from "./list-commute-records.js";
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

describe("ListCommuteRecords", () => {
  it("returns frontend-friendly commute record views", async () => {
    const recordReader: CommuteRecordReader = {
      listRecent: vi.fn().mockResolvedValue([
        {
          id: 1,
          createdAt: new Date("2026-05-01T07:30:00.000Z"),
          durationInTraffic: 35,
          staticDuration: 25,
          dayOfWeek: "Friday"
        }
      ])
    };
    const useCase = new ListCommuteRecords(recordReader);

    await expect(useCase.execute(10)).resolves.toEqual([
      {
        id: 1,
        createdAt: "2026-05-01T07:30:00.000Z",
        durationInTraffic: 35,
        staticDuration: 25,
        delay: 10,
        dayOfWeek: "Friday"
      }
    ]);
    expect(recordReader.listRecent).toHaveBeenCalledWith(10);
  });
});
