import { describe, expect, it, vi } from "vitest";
import { RecordCommuteSnapshot } from "./record-commute-snapshot.js";
import type {
  CommuteRecordRepository,
  CommuteRouteClient,
  RouteSettingsReader
} from "./record-commute-snapshot.js";

const routeSettings = {
  origin: { label: "Home", latitude: 51.5, longitude: -0.12 },
  destination: { label: "Office", latitude: 51.45, longitude: -2.58 }
};

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
    const routeSettingsReader: RouteSettingsReader = {
      getCurrent: vi.fn().mockResolvedValue(routeSettings)
    };
    const useCase = new RecordCommuteSnapshot(
      routeClient,
      routeSettingsReader,
      routeSettings,
      recordRepository,
      () => new Date("2026-05-06T07:30:00.000Z")
    );

    const record = await useCase.execute();

    expect(routeSettingsReader.getCurrent).toHaveBeenCalledWith(routeSettings);
    expect(routeClient.getCurrentDriveDurations).toHaveBeenCalledWith(routeSettings);
    expect(recordRepository.save).toHaveBeenCalledWith({
      capturedAt: new Date("2026-05-06T07:30:00.000Z"),
      captureSource: "scheduled",
      durationInTraffic: 38,
      staticDuration: 26,
      originLabel: "Home",
      originLatitude: 51.5,
      originLongitude: -0.12,
      destinationLabel: "Office",
      destinationLatitude: 51.45,
      destinationLongitude: -2.58,
      dayOfWeek: "Wednesday"
    });
    expect(record).toMatchObject({
      id: 7,
      durationInTraffic: 38,
      staticDuration: 26,
      dayOfWeek: "Wednesday"
    });
  });

  it("can persist manual commute snapshots", async () => {
    const routeClient: CommuteRouteClient = {
      getCurrentDriveDurations: vi.fn().mockResolvedValue({
        durationInTraffic: 38,
        staticDuration: 26
      })
    };
    const recordRepository: CommuteRecordRepository = {
      save: vi.fn().mockImplementation(async (record) => ({
        id: 8,
        createdAt: new Date("2026-05-06T07:30:00.000Z"),
        ...record
      }))
    };
    const routeSettingsReader: RouteSettingsReader = {
      getCurrent: vi.fn().mockResolvedValue(routeSettings)
    };
    const useCase = new RecordCommuteSnapshot(
      routeClient,
      routeSettingsReader,
      routeSettings,
      recordRepository,
      () => new Date("2026-05-06T07:30:00.000Z")
    );

    await useCase.execute("manual");

    expect(recordRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        captureSource: "manual"
      })
    );
  });
});
