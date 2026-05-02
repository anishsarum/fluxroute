import { describe, expect, it, vi } from "vitest";
import { RecordCommuteSnapshot } from "./record-commute-snapshot.js";
import type {
  CommuteRecordRepository,
  CommuteRouteClient
} from "./record-commute-snapshot.js";

describe("RecordCommuteSnapshot", () => {
  it("fetches current commute durations and persists a commute record", async () => {
    const routeClient: CommuteRouteClient = {
      getCurrentDriveDurations: vi.fn().mockResolvedValue({
        durationInTraffic: 38,
        staticDuration: 26
      })
    };
    const recordRepository: CommuteRecordRepository = {
      save: vi.fn().mockImplementation(async (record) => ({
        id: 7,
        createdAt: new Date("2026-05-06T07:30:00.000Z"),
        ...record
      }))
    };
    const useCase = new RecordCommuteSnapshot(
      routeClient,
      recordRepository,
      () => new Date("2026-05-06T07:30:00.000Z")
    );

    const record = await useCase.execute();

    expect(routeClient.getCurrentDriveDurations).toHaveBeenCalledOnce();
    expect(recordRepository.save).toHaveBeenCalledWith({
      durationInTraffic: 38,
      staticDuration: 26,
      dayOfWeek: "Wednesday"
    });
    expect(record).toMatchObject({
      id: 7,
      durationInTraffic: 38,
      staticDuration: 26,
      dayOfWeek: "Wednesday"
    });
  });
});
