import { describe, expect, it } from "vitest";
import { parseGoogleDuration } from "./commute-duration.js";

describe("parseGoogleDuration", () => {
  it("converts Google duration seconds into rounded minutes", () => {
    expect(parseGoogleDuration("600s")).toBe(10);
    expect(parseGoogleDuration("89s")).toBe(1);
    expect(parseGoogleDuration("90s")).toBe(2);
  });

  it("rejects missing durations", () => {
    expect(() => parseGoogleDuration(undefined)).toThrow(
      "Google Routes API response did not include a duration"
    );
  });

  it("rejects malformed durations", () => {
    expect(() => parseGoogleDuration("soon")).toThrow(
      "Could not parse Google duration value: soon"
    );
  });
});
