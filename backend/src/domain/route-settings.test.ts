import { describe, expect, it } from "vitest";
import { validateRouteSettings } from "./route-settings.js";

const validRouteSettings = {
  origin: {
    label: " Home ",
    latitude: 51.5,
    longitude: -0.12
  },
  destination: {
    label: "Office",
    latitude: 51.45,
    longitude: -2.58
  }
};

describe("validateRouteSettings", () => {
  it("trims labels and accepts valid coordinate ranges", () => {
    expect(validateRouteSettings(validRouteSettings)).toEqual({
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

  it("rejects blank labels", () => {
    expect(() =>
      validateRouteSettings({
        ...validRouteSettings,
        origin: {
          ...validRouteSettings.origin,
          label: " "
        }
      })
    ).toThrow("origin label is required");
  });

  it("rejects coordinates outside valid ranges", () => {
    expect(() =>
      validateRouteSettings({
        ...validRouteSettings,
        destination: {
          ...validRouteSettings.destination,
          longitude: 181
        }
      })
    ).toThrow("destination longitude must be between -180 and 180");
  });
});
