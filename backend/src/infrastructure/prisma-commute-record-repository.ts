import type { PrismaClient } from "@prisma/client";
import type {
  NewCommuteRecord,
  SavedCommuteRecord
} from "../domain/commute-record.js";
import type { CommuteRecordRepository } from "../application/record-commute-snapshot.js";

export class PrismaCommuteRecordRepository implements CommuteRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: NewCommuteRecord): Promise<SavedCommuteRecord> {
    return this.prisma.commuteRecord.create({
      data: record
    });
  }
}
