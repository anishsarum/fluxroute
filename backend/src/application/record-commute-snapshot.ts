import { buildCommuteRecord, type NewCommuteRecord, type SavedCommuteRecord } from "../domain/commute-record.js";
import type { CommuteDurations } from "../domain/commute-duration.js";

export type CommuteRouteClient = {
  getCurrentDriveDurations(): Promise<CommuteDurations>;
};

export type CommuteRecordRepository = {
  save(record: NewCommuteRecord): Promise<SavedCommuteRecord>;
};

export type Clock = () => Date;

export class RecordCommuteSnapshot {
  constructor(
    private readonly routeClient: CommuteRouteClient,
    private readonly recordRepository: CommuteRecordRepository,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(): Promise<SavedCommuteRecord> {
    const durations = await this.routeClient.getCurrentDriveDurations();
    const record = buildCommuteRecord(durations, this.clock());

    return this.recordRepository.save(record);
  }
}
