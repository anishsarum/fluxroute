import type { CaptureSource, SavedCommuteRecord } from "../domain/commute-record.js";

export type CaptureSourceFilter = CaptureSource | "all";

export type CommuteRecordReader = {
  listRecent(limit: number, captureSource?: CaptureSourceFilter): Promise<SavedCommuteRecord[]>;
};

export type CommuteRecordView = {
  id: number;
  createdAt: string;
  capturedAt: string;
  captureSource: CaptureSource;
  durationInTraffic: number;
  staticDuration: number;
  delay: number;
  dayOfWeek: string;
};

export class ListCommuteRecords {
  constructor(private readonly recordReader: CommuteRecordReader) {}

  async execute(limit = 100, captureSource: CaptureSourceFilter = "scheduled"): Promise<CommuteRecordView[]> {
    const records = await this.recordReader.listRecent(
      normalizeLimit(limit),
      normalizeCaptureSourceFilter(captureSource)
    );

    return records.map(toCommuteRecordView);
  }
}

export function normalizeLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) {
    return 100;
  }

  return Math.min(limit, 500);
}

export function normalizeCaptureSourceFilter(
  captureSource: string | undefined
): CaptureSourceFilter {
  if (captureSource === "manual" || captureSource === "all") {
    return captureSource;
  }

  return "scheduled";
}

export function toCommuteRecordView(record: SavedCommuteRecord): CommuteRecordView {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    capturedAt: record.capturedAt.toISOString(),
    captureSource: record.captureSource,
    durationInTraffic: record.durationInTraffic,
    staticDuration: record.staticDuration,
    delay: record.durationInTraffic - record.staticDuration,
    dayOfWeek: record.dayOfWeek
  };
}
