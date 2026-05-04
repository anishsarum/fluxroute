import {
  buildCommuteRecord,
  type CaptureSource,
  type NewCommuteRecord,
  type SavedCommuteRecord
} from "../domain/commute-record.js";
import type { CommuteDurations } from "../domain/commute-duration.js";
import type { RouteSettings } from "../domain/route-settings.js";

export type CommuteRouteClient = {
  getCurrentDriveDurations(routeSettings: RouteSettings): Promise<CommuteDurations>;
};

export type CommuteRecordRepository = {
  save(record: NewCommuteRecord): Promise<SavedCommuteRecord>;
};

export type Clock = () => Date;

export type RouteSettingsReader = {
  getCurrent(defaultSettings: RouteSettings): Promise<RouteSettings>;
};

export class RecordCommuteSnapshot {
  constructor(
    private readonly routeClient: CommuteRouteClient,
    private readonly routeSettingsReader: RouteSettingsReader,
    private readonly defaultRouteSettings: RouteSettings,
    private readonly recordRepository: CommuteRecordRepository,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(captureSource: CaptureSource = "scheduled"): Promise<SavedCommuteRecord> {
    const routeSettings = await this.routeSettingsReader.getCurrent(this.defaultRouteSettings);
    const durations = await this.routeClient.getCurrentDriveDurations(routeSettings);
    const record = buildCommuteRecord(durations, routeSettings, this.clock(), captureSource);

    return this.recordRepository.save(record);
  }
}
