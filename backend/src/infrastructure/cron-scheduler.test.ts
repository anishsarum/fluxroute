import { describe, expect, it } from "vitest";
import { commutePollingSchedule } from "./cron-scheduler.js";

describe("commutePollingSchedule", () => {
  it("polls every minute during weekday commute hours", () => {
    expect(commutePollingSchedule).toBe("* 7,8 * * 1-5");
  });
});
