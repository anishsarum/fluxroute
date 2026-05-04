import { validateRouteSettings, type RouteSettings } from "../domain/route-settings.js";

export type RouteSettingsWriter = {
  save(routeSettings: RouteSettings): Promise<RouteSettings>;
};

export class UpdateRouteSettings {
  constructor(private readonly routeSettingsWriter: RouteSettingsWriter) {}

  async execute(routeSettings: RouteSettings): Promise<RouteSettings> {
    return this.routeSettingsWriter.save(validateRouteSettings(routeSettings));
  }
}
