import type {
  CaptureSourceFilter,
  CommuteRecordReader,
  CommuteRecordView
} from "./list-commute-records.js";
import {
  normalizeCaptureSourceFilter,
  toCommuteRecordView
} from "./list-commute-records.js";

export type DepartureMinuteCommuteSummary = {
  departureMinute: string;
  averageDurationInTraffic: number;
  averageStaticDuration: number;
  averageDelay: number;
  sampleSize: number;
};

export type CommuteSummary = {
  sampleSize: number;
  recentRecords: CommuteRecordView[];
  departureMinuteAverages: DepartureMinuteCommuteSummary[];
};

export class GetCommuteSummary {
  constructor(private readonly recordReader: CommuteRecordReader) {}

  async execute(limit = 500, captureSource: CaptureSourceFilter = "scheduled"): Promise<CommuteSummary> {
    const records = await this.recordReader.listRecent(
      limit,
      normalizeCaptureSourceFilter(captureSource)
    );

    return {
      sampleSize: records.length,
      recentRecords: records.slice(0, 10).map(toCommuteRecordView),
      departureMinuteAverages: Array.from(groupRecordsByDepartureMinute(records).entries())
        .sort(([firstMinute], [secondMinute]) => firstMinute.localeCompare(secondMinute))
        .map(([departureMinute, recordsForMinute]) => ({
          departureMinute,
          averageDurationInTraffic: average(
            recordsForMinute.map((record) => record.durationInTraffic)
          ),
          averageStaticDuration: average(recordsForMinute.map((record) => record.staticDuration)),
          averageDelay: average(
            recordsForMinute.map((record) => record.durationInTraffic - record.staticDuration)
          ),
          sampleSize: recordsForMinute.length
        }))
    };
  }
}

function groupRecordsByDepartureMinute(
  records: Awaited<ReturnType<CommuteRecordReader["listRecent"]>>
): Map<string, Awaited<ReturnType<CommuteRecordReader["listRecent"]>>> {
  const groupedRecords = new Map<string, Awaited<ReturnType<CommuteRecordReader["listRecent"]>>>();

  for (const record of records) {
    const departureMinute = formatDepartureMinute(record.capturedAt);
    const recordsForMinute = groupedRecords.get(departureMinute) ?? [];
    recordsForMinute.push(record);
    groupedRecords.set(departureMinute, recordsForMinute);
  }

  return groupedRecords;
}

function formatDepartureMinute(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function average(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round((total / values.length) * 10) / 10;
}
