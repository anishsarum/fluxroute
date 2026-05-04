import type { RouteSettings } from "../domain/route-settings.js";

export type RouteSettingsReader = {
  getCurrent(defaultSettings: RouteSettings): Promise<RouteSettings>;
};

export class GetRouteSettings {
  constructor(
    private readonly routeSettingsReader: RouteSettingsReader,
    private readonly defaultSettings: RouteSettings
  ) {}

  async execute(): Promise<RouteSettings> {
    return this.routeSettingsReader.getCurrent(this.defaultSettings);
  }
}
