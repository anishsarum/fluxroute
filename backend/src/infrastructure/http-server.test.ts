import { describe, expect, it, vi } from "vitest";
import { buildHttpServer } from "./http-server.js";
import type { GetCommuteSummary } from "../application/get-commute-summary.js";
import type { ListCommuteRecords } from "../application/list-commute-records.js";

describe("buildHttpServer", () => {
  it("responds to health checks", async () => {
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
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

  it("returns commute records with the requested limit", async () => {
    const listCommuteRecords = {
      execute: vi.fn().mockResolvedValue([{ id: 1 }])
    } as unknown as ListCommuteRecords;
    const app = await buildHttpServer({
      listCommuteRecords,
      getCommuteSummary: { execute: vi.fn() } as unknown as GetCommuteSummary,
      logger: false
    });

    const response = await app.inject({
      method: "GET",
      url: "/commute-records?limit=25"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([{ id: 1 }]);
    expect(listCommuteRecords.execute).toHaveBeenCalledWith(25);

    await app.close();
  });

  it("returns commute summary data", async () => {
    const getCommuteSummary = {
      execute: vi.fn().mockResolvedValue({ sampleSize: 0, recentRecords: [], weekdayAverages: [] })
    } as unknown as GetCommuteSummary;
    const app = await buildHttpServer({
      listCommuteRecords: { execute: vi.fn() } as unknown as ListCommuteRecords,
      getCommuteSummary,
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
    expect(getCommuteSummary.execute).toHaveBeenCalledWith(undefined);

    await app.close();
  });
});
