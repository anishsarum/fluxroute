import { describe, expect, it, vi } from "vitest";
import { GoogleRoutesClient } from "./google-routes-client.js";
import type { GoogleRoutesConfig } from "../config/env.js";

const config: GoogleRoutesConfig = {
  apiKey: "test-api-key",
  origin: {
    latitude: 51.5,
    longitude: -0.12
  },
  destination: {
    latitude: 51.45,
    longitude: -2.58
  }
};

describe("GoogleRoutesClient", () => {
  it("requests traffic-aware route durations from Google Routes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            duration: "1800s",
            staticDuration: "1200s"
          }
        ]
      })
    });
    const client = new GoogleRoutesClient(config, fetchImpl as typeof fetch);

    await expect(client.getCurrentDriveDurations()).resolves.toEqual({
      durationInTraffic: 30,
      staticDuration: 20
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Goog-Api-Key": "test-api-key",
          "X-Goog-FieldMask": "routes.duration,routes.staticDuration"
        })
      })
    );
  });

  it("throws when Google returns no routes", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] })
    });
    const client = new GoogleRoutesClient(config, fetchImpl as typeof fetch);

    await expect(client.getCurrentDriveDurations()).rejects.toThrow(
      "Google Routes API response did not include any routes"
    );
  });

  it("includes the response body when Google returns an error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "forbidden"
    });
    const client = new GoogleRoutesClient(config, fetchImpl as typeof fetch);

    await expect(client.getCurrentDriveDurations()).rejects.toThrow(
      "Google Routes API request failed: 403 forbidden"
    );
  });
});
