import { parseGoogleDuration, type CommuteDurations } from "../domain/commute-duration.js";
import type { GoogleRoutesConfig } from "../config/env.js";
import type { CommuteRouteClient } from "../application/record-commute-snapshot.js";
import type { RouteSettings } from "../domain/route-settings.js";

type Fetch = typeof fetch;
type Clock = () => Date;

const departureOffsetMs = 60_000;

type GoogleRoutesResponse = {
  routes?: Array<{
    duration?: string;
    staticDuration?: string;
  }>;
};

export class GoogleRoutesClient implements CommuteRouteClient {
  constructor(
    private readonly config: GoogleRoutesConfig,
    private readonly fetchImpl: Fetch = fetch,
    private readonly clock: Clock = () => new Date()
  ) {}

  async getCurrentDriveDurations(routeSettings: RouteSettings): Promise<CommuteDurations> {
    const response = await this.fetchImpl("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.config.apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.staticDuration"
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: {
              latitude: routeSettings.origin.latitude,
              longitude: routeSettings.origin.longitude
            }
          }
        },
        destination: {
          location: {
            latLng: {
              latitude: routeSettings.destination.latitude,
              longitude: routeSettings.destination.longitude
            }
          }
        },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        departureTime: this.getDepartureTime()
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google Routes API request failed: ${response.status} ${errorBody}`);
    }

    const payload = (await response.json()) as GoogleRoutesResponse;
    const route = payload.routes?.[0];

    if (!route) {
      throw new Error("Google Routes API response did not include any routes");
    }

    return {
      durationInTraffic: parseGoogleDuration(route.duration),
      staticDuration: parseGoogleDuration(route.staticDuration)
    };
  }

  private getDepartureTime(): string {
    return new Date(this.clock().getTime() + departureOffsetMs).toISOString();
  }
}
