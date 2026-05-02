import type { SavedCommuteRecord } from "../domain/commute-record.js";

export type CommuteRecordReader = {
  listRecent(limit: number): Promise<SavedCommuteRecord[]>;
};

export type CommuteRecordView = {
  id: number;
  createdAt: string;
  durationInTraffic: number;
  staticDuration: number;
  delay: number;
  dayOfWeek: string;
};

export class ListCommuteRecords {
  constructor(private readonly recordReader: CommuteRecordReader) {}

  async execute(limit = 100): Promise<CommuteRecordView[]> {
    const records = await this.recordReader.listRecent(normalizeLimit(limit));

    return records.map(toCommuteRecordView);
  }
}

export function normalizeLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) {
    return 100;
  }

  return Math.min(limit, 500);
}

export function toCommuteRecordView(record: SavedCommuteRecord): CommuteRecordView {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    durationInTraffic: record.durationInTraffic,
    staticDuration: record.staticDuration,
    delay: record.durationInTraffic - record.staticDuration,
    dayOfWeek: record.dayOfWeek
  };
}
