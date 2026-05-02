import type { PrismaClient } from "@prisma/client";
import type {
  NewCommuteRecord,
  SavedCommuteRecord
} from "../domain/commute-record.js";
import type { CommuteRecordRepository } from "../application/record-commute-snapshot.js";
import type { CommuteRecordReader } from "../application/list-commute-records.js";

export class PrismaCommuteRecordRepository implements CommuteRecordRepository, CommuteRecordReader {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: NewCommuteRecord): Promise<SavedCommuteRecord> {
    return this.prisma.commuteRecord.create({
      data: record
    });
  }

  async listRecent(limit: number): Promise<SavedCommuteRecord[]> {
    return this.prisma.commuteRecord.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  }
}
