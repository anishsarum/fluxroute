import { describe, expect, it } from "vitest";
import { loadConfig } from "./env.js";

const validEnv = {
  GOOGLE_ROUTES_API_KEY: "test-key",
  COMMUTE_ORIGIN_LAT: "51.5",
  COMMUTE_ORIGIN_LNG: "-0.12",
  COMMUTE_DESTINATION_LAT: "51.45",
  COMMUTE_DESTINATION_LNG: "-2.58"
};

describe("loadConfig", () => {
  it("loads commute API, coordinate, timezone, and port config", () => {
    expect(
      loadConfig({
        ...validEnv,
        TZ: "Europe/London",
        PORT: "4000"
      })
    ).toEqual({
      timezone: "Europe/London",
      port: 4000,
      routeSettings: {
        origin: {
          label: "Origin",
          latitude: 51.5,
          longitude: -0.12
        },
        destination: {
          label: "Destination",
          latitude: 51.45,
          longitude: -2.58
        }
      },
      googleRoutes: {
        apiKey: "test-key"
      }
    });
  });

  it("loads optional public route labels", () => {
    expect(
      loadConfig({
        ...validEnv,
        COMMUTE_ORIGIN_LABEL: "Home",
        COMMUTE_DESTINATION_LABEL: "Office"
      }).routeSettings
    ).toEqual({
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
    });
  });

  it("uses default timezone and port when optional env vars are absent", () => {
    expect(loadConfig(validEnv).timezone).toBe("Europe/London");
    expect(loadConfig(validEnv).port).toBe(3000);
  });

  it("rejects missing required config", () => {
    expect(() =>
      loadConfig({
        ...validEnv,
        GOOGLE_ROUTES_API_KEY: undefined
      })
    ).toThrow("Missing required environment variable: GOOGLE_ROUTES_API_KEY");
  });

  it("rejects invalid coordinates", () => {
    expect(() =>
      loadConfig({
        ...validEnv,
        COMMUTE_ORIGIN_LAT: "north"
      })
    ).toThrow("Environment variable COMMUTE_ORIGIN_LAT must be a valid number");
  });

  it("rejects invalid ports", () => {
    expect(() =>
      loadConfig({
        ...validEnv,
        PORT: "99999"
      })
    ).toThrow("Environment variable PORT must be an integer between 1 and 65535");
  });
});
