import { afterEach, describe, expect, it, vi } from "vitest";
import { getCommuteRecords, getCommuteSummary, getHealth } from "./api";

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches health status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ status: "ok" }));

    await expect(getHealth()).resolves.toEqual({ status: "ok" });
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/health");
  });

  it("fetches commute records with a limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([{ id: 1 }]));

    await expect(getCommuteRecords(25)).resolves.toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/commute-records?limit=25");
  });

  it("fetches commute summary", async () => {
    const summary = { sampleSize: 0, recentRecords: [], weekdayAverages: [] };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(summary));

    await expect(getCommuteSummary()).resolves.toEqual(summary);
  });

  it("throws when an API request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    await expect(getHealth()).rejects.toThrow("Request failed: 500");
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
