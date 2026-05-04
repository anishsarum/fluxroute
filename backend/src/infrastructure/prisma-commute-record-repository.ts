import type { PrismaClient } from "@prisma/client";
import type {
  CaptureSource,
  NewCommuteRecord,
  SavedCommuteRecord
} from "../domain/commute-record.js";
import type { CommuteRecordRepository } from "../application/record-commute-snapshot.js";
import type {
  CaptureSourceFilter,
  CommuteRecordReader
} from "../application/list-commute-records.js";

export class PrismaCommuteRecordRepository implements CommuteRecordRepository, CommuteRecordReader {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: NewCommuteRecord): Promise<SavedCommuteRecord> {
    const savedRecord = await this.prisma.commuteRecord.create({
      data: record
    });

    return toSavedCommuteRecord(savedRecord);
  }

  async listRecent(
    limit: number,
    captureSource: CaptureSourceFilter = "scheduled"
  ): Promise<SavedCommuteRecord[]> {
    const records = await this.prisma.commuteRecord.findMany({
      where:
        captureSource === "all"
          ? undefined
          : {
              captureSource
            },
      orderBy: {
        capturedAt: "desc"
      },
      take: limit
    });

    return records.map(toSavedCommuteRecord);
  }
}

type PrismaCommuteRecord = {
  id: number;
  createdAt: Date;
  capturedAt: Date;
  captureSource: string;
  durationInTraffic: number;
  staticDuration: number;
  originLabel: string;
  originLatitude: number;
  originLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
  dayOfWeek: string;
};

function toSavedCommuteRecord(record: PrismaCommuteRecord): SavedCommuteRecord {
  return {
    ...record,
    captureSource: toCaptureSource(record.captureSource)
  };
}

function toCaptureSource(captureSource: string): CaptureSource {
  return captureSource === "manual" ? "manual" : "scheduled";
}
