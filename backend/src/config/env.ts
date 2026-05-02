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
  port: number;
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
    port: parsePort(process.env.PORT),
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

function parsePort(port: string | undefined): number {
  if (!port) {
    return 3000;
  }

  const parsedPort = Number(port);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error("Environment variable PORT must be an integer between 1 and 65535");
  }

  return parsedPort;
}
