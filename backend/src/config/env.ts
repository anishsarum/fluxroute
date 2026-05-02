export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type GoogleRoutesConfig = {
  apiKey: string;
  origin: Coordinate;
  destination: Coordinate;
};

export type AppConfig = {
  timezone: string;
  googleRoutes: GoogleRoutesConfig;
};

type RequiredEnv =
  | "GOOGLE_ROUTES_API_KEY"
  | "COMMUTE_ORIGIN_LAT"
  | "COMMUTE_ORIGIN_LNG"
  | "COMMUTE_DESTINATION_LAT"
  | "COMMUTE_DESTINATION_LNG";

function getRequiredEnv(name: RequiredEnv): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseCoordinate(name: RequiredEnv): number {
  const value = Number(getRequiredEnv(name));

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return value;
}

export function loadConfig(): AppConfig {
  return {
    timezone: process.env.TZ ?? "Europe/London",
    googleRoutes: {
      apiKey: getRequiredEnv("GOOGLE_ROUTES_API_KEY"),
      origin: {
        latitude: parseCoordinate("COMMUTE_ORIGIN_LAT"),
        longitude: parseCoordinate("COMMUTE_ORIGIN_LNG")
      },
      destination: {
        latitude: parseCoordinate("COMMUTE_DESTINATION_LAT"),
        longitude: parseCoordinate("COMMUTE_DESTINATION_LNG")
      }
    }
  };
}
