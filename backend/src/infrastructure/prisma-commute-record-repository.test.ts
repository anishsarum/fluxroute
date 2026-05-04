import { describe, expect, it, vi } from "vitest";
import { PrismaCommuteRecordRepository } from "./prisma-commute-record-repository.js";

describe("PrismaCommuteRecordRepository", () => {
  it("saves commute records with route snapshots", async () => {
    const prisma = {
      commuteRecord: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: 1,
          createdAt: new Date("2026-05-04T07:30:00.000Z"),
          ...data
        }))
      }
    };
    const repository = new PrismaCommuteRecordRepository(prisma as never);
    const record = {
      capturedAt: new Date("2026-05-04T07:29:00.000Z"),
      captureSource: "manual" as const,
      durationInTraffic: 26,
      staticDuration: 28,
      originLabel: "Home",
      originLatitude: 51.5,
      originLongitude: -0.12,
      destinationLabel: "Office",
      destinationLatitude: 51.45,
      destinationLongitude: -2.58,
      dayOfWeek: "Monday"
    };

    await expect(repository.save(record)).resolves.toMatchObject(record);
    expect(prisma.commuteRecord.create).toHaveBeenCalledWith({
      data: record
    });
  });

});
