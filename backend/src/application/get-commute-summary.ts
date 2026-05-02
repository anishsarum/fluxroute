import type { CommuteRecordReader, CommuteRecordView } from "./list-commute-records.js";
import { toCommuteRecordView } from "./list-commute-records.js";

export type WeekdayCommuteSummary = {
  dayOfWeek: string;
  averageDurationInTraffic: number;
  averageStaticDuration: number;
  averageDelay: number;
  sampleSize: number;
};

export type CommuteSummary = {
  sampleSize: number;
  recentRecords: CommuteRecordView[];
  weekdayAverages: WeekdayCommuteSummary[];
};

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export class GetCommuteSummary {
  constructor(private readonly recordReader: CommuteRecordReader) {}

  async execute(limit = 500): Promise<CommuteSummary> {
    const records = await this.recordReader.listRecent(limit);

    return {
      sampleSize: records.length,
      recentRecords: records.slice(0, 10).map(toCommuteRecordView),
      weekdayAverages: weekdays.flatMap((dayOfWeek) => {
        const recordsForDay = records.filter((record) => record.dayOfWeek === dayOfWeek);

        if (recordsForDay.length === 0) {
          return [];
        }

        return [
          {
            dayOfWeek,
            averageDurationInTraffic: average(
              recordsForDay.map((record) => record.durationInTraffic)
            ),
            averageStaticDuration: average(recordsForDay.map((record) => record.staticDuration)),
            averageDelay: average(
              recordsForDay.map((record) => record.durationInTraffic - record.staticDuration)
            ),
            sampleSize: recordsForDay.length
          }
        ];
      })
    };
  }
}

function average(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round((total / values.length) * 10) / 10;
}
