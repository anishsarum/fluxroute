import { describe, expect, it, vi } from "vitest";
import { buildHttpServer } from "./http-server.js";
import type { GetCommuteSummary } from "../application/get-commute-summary.js";
import type { GetRouteSettings } from "../application/get-route-settings.js";
import type { ListCommuteRecords } from "../application/list-commute-records.js";
import type { RecordCommuteSnapshot } from "../application/record-commute-snapshot.js";
import type { UpdateRouteSettings } from "../application/update-route-settings.js";

const routeSettings = {
  origin: {
    label: "Home",
    latitude: 51.5,
    longitude: -0.12
  },
  destination: {
    label: "Office",
    latitude: 51.45,
    longitude: -2.58
  }
};

describe("buildHttpServer", () => {
  it("responds to health checks", async () => {
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn().mockResolvedValue(routeSettings) } as unknown as GetRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });

    await app.close();
  });

  it("returns public route settings without API credentials", async () => {
    const getRouteSettings = {
      execute: vi.fn().mockResolvedValue(routeSettings)
    } as unknown as GetRouteSettings;
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/route-settings/current"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(routeSettings);
    expect(response.body).not.toContain("apiKey");
    expect(getRouteSettings.execute).toHaveBeenCalledOnce();

    await app.close();
  });

  it("updates route settings", async () => {
    const updateRouteSettings = {
      execute: vi.fn().mockResolvedValue(routeSettings)
    } as unknown as UpdateRouteSettings;
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn() } as unknown as GetRouteSettings,
      updateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "PUT",
      url: "/route-settings/current",
      payload: routeSettings
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(routeSettings);
    expect(updateRouteSettings.execute).toHaveBeenCalledWith(routeSettings);

    await app.close();
  });

  it("returns a bad request when route settings are invalid", async () => {
    const updateRouteSettings = {
      execute: vi.fn().mockRejectedValue(new Error("origin latitude must be between -90 and 90"))
    } as unknown as UpdateRouteSettings;
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn() } as unknown as GetRouteSettings,
      updateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "PUT",
      url: "/route-settings/current",
      payload: {
        ...routeSettings,
        origin: {
          ...routeSettings.origin,
          latitude: 999
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "origin latitude must be between -90 and 90" });

    await app.close();
  });

  it("returns commute records with the requested limit", async () => {
    const listCommuteRecords = {
      execute: vi.fn().mockResolvedValue([{ id: 1 }])
    } as unknown as ListCommuteRecords;
    const app = await buildHttpServer({
      listCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn().mockResolvedValue(routeSettings) } as unknown as GetRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/commute-records?limit=25"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: 1 }]);
    expect(listCommuteRecords.execute).toHaveBeenCalledWith(25, "scheduled");

    await app.close();
  });

  it("passes undefined for malformed commute record limits", async () => {
    const listCommuteRecords = {
      execute: vi.fn().mockResolvedValue([])
    } as unknown as ListCommuteRecords;
    const app = await buildHttpServer({
      listCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn().mockResolvedValue(routeSettings) } as unknown as GetRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/commute-records?limit=bad"
    });

    expect(response.statusCode).toBe(200);
    expect(listCommuteRecords.execute).toHaveBeenCalledWith(undefined, "scheduled");

    await app.close();
  });

  it("returns commute summary data", async () => {
    const getCommuteSummary = {
      execute: vi.fn().mockResolvedValue({ sampleSize: 0, recentRecords: [], weekdayAverages: [] })
    } as unknown as GetCommuteSummary;
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn().mockResolvedValue(routeSettings) } as unknown as GetRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/commute-records/summary"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      sampleSize: 0,
      recentRecords: [],
      weekdayAverages: []
    });
    expect(getCommuteSummary.execute).toHaveBeenCalledWith(undefined, "scheduled");

    await app.close();
  });

  it("passes capture source filters to read endpoints", async () => {
    const listCommuteRecords = {
      execute: vi.fn().mockResolvedValue([])
    } as unknown as ListCommuteRecords;
    const getCommuteSummary = {
      execute: vi.fn().mockResolvedValue({ sampleSize: 0, recentRecords: [], weekdayAverages: [] })
    } as unknown as GetCommuteSummary;
    const app = await buildHttpServer({
      listCommuteRecords,
      getCommuteSummary,
      recordCommuteSnapshot: { execute: vi.fn() } as unknown as RecordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn().mockResolvedValue(routeSettings) } as unknown as GetRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    await app.inject({
      method: "GET",
      url: "/commute-records?captureSource=manual"
    });
    await app.inject({
      method: "GET",
      url: "/commute-records/summary?captureSource=all"
    });

    expect(listCommuteRecords.execute).toHaveBeenCalledWith(undefined, "manual");
    expect(getCommuteSummary.execute).toHaveBeenCalledWith(undefined, "all");

    await app.close();
  });

  it("collects manual commute records", async () => {
    const recordCommuteSnapshot = {
      execute: vi.fn().mockResolvedValue({
        id: 10,
        createdAt: new Date("2026-05-06T07:31:00.000Z"),
        capturedAt: new Date("2026-05-06T07:30:00.000Z"),
        captureSource: "manual",
        durationInTraffic: 38,
        staticDuration: 26,
        dayOfWeek: "Wednesday"
      })
    } as unknown as RecordCommuteSnapshot;
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      recordCommuteSnapshot,
      getRouteSettings: { execute: vi.fn().mockResolvedValue(routeSettings) } as unknown as GetRouteSettings,
      updateRouteSettings: { execute: vi.fn() } as unknown as UpdateRouteSettings,
      logger: false
    });

    const response = await app.inject({
      method: "POST",
      url: "/commute-records/collect"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: 10,
      captureSource: "manual",
      delay: 12
    });
    expect(recordCommuteSnapshot.execute).toHaveBeenCalledWith("manual");

    await app.close();
  });
});
