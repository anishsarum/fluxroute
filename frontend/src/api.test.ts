import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectCommuteRecord,
  getApiBaseUrl,
  getCommuteRecords,
  getCommuteSummary,
  getCurrentRouteSettings,
  getHealth,
  updateCurrentRouteSettings
} from "./api";

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches health status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ status: "ok" }));

    await expect(getHealth()).resolves.toEqual({ status: "ok" });
    expect(fetch).toHaveBeenCalledWith("/api/health");
  });

  it("fetches current route settings", async () => {
    const routeSettings = {
      origin: { label: "Home", latitude: 51.5, longitude: -0.12 },
      destination: { label: "Office", latitude: 51.45, longitude: -2.58 }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(routeSettings));

    await expect(getCurrentRouteSettings()).resolves.toEqual(routeSettings);
    expect(fetch).toHaveBeenCalledWith("/api/route-settings/current");
  });

  it("updates current route settings", async () => {
    const routeSettings = {
      origin: { label: "Home", latitude: 51.5, longitude: -0.12 },
      destination: { label: "Office", latitude: 51.45, longitude: -2.58 }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(routeSettings));

    await expect(updateCurrentRouteSettings(routeSettings)).resolves.toEqual(routeSettings);
    expect(fetch).toHaveBeenCalledWith("/api/route-settings/current", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(routeSettings)
    });
  });

  it("fetches commute records with a limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([{ id: 1 }]));

    await expect(getCommuteRecords(25)).resolves.toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledWith(
      "/api/commute-records?limit=25&captureSource=scheduled"
    );
  });

  it("fetches commute records with a capture source filter", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([{ id: 1 }]));

    await getCommuteRecords(25, "manual");

    expect(fetch).toHaveBeenCalledWith(
      "/api/commute-records?limit=25&captureSource=manual"
    );
  });

  it("fetches commute summary", async () => {
    const summary = { sampleSize: 0, recentRecords: [], departureMinuteAverages: [] };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(summary));

    await expect(getCommuteSummary()).resolves.toEqual(summary);
    expect(fetch).toHaveBeenCalledWith(
      "/api/commute-records/summary?captureSource=scheduled"
    );
  });

  it("posts manual commute collection requests", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: 1 }));

    await expect(collectCommuteRecord()).resolves.toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith("/api/commute-records/collect", {
      method: "POST"
    });
  });

  it("throws when an API request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    await expect(getHealth()).rejects.toThrow("Request failed: 500");
  });

  it("uses the default API base URL", () => {
    expect(getApiBaseUrl()).toBe("/api");
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body
  } as Response;
}
