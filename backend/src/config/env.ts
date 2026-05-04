import type { RouteSettings } from "../domain/route-settings.js";

export type GoogleRoutesConfig = {
  apiKey: string;
};

export type AppConfig = {
  timezone: string;
  port: number;
  routeSettings: RouteSettings;
  googleRoutes: GoogleRoutesConfig;
};

type RequiredEnv =
  | "GOOGLE_ROUTES_API_KEY"
  | "COMMUTE_ORIGIN_LAT"
  | "COMMUTE_ORIGIN_LNG"
  | "COMMUTE_DESTINATION_LAT"
  | "COMMUTE_DESTINATION_LNG";

type Env = NodeJS.ProcessEnv;

function getRequiredEnv(env: Env, name: RequiredEnv): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseCoordinate(env: Env, name: RequiredEnv): number {
  const value = Number(getRequiredEnv(env, name));

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return value;
}

export function loadConfig(env: Env = process.env): AppConfig {
  const origin = {
    latitude: parseCoordinate(env, "COMMUTE_ORIGIN_LAT"),
    longitude: parseCoordinate(env, "COMMUTE_ORIGIN_LNG")
  };
  const destination = {
    latitude: parseCoordinate(env, "COMMUTE_DESTINATION_LAT"),
    longitude: parseCoordinate(env, "COMMUTE_DESTINATION_LNG")
  };

  return {
    timezone: env.TZ ?? "Europe/London",
    port: parsePort(env.PORT),
    routeSettings: {
      origin: {
        ...origin,
        label: env.COMMUTE_ORIGIN_LABEL ?? "Origin"
      },
      destination: {
        ...destination,
        label: env.COMMUTE_DESTINATION_LABEL ?? "Destination"
      }
    },
    googleRoutes: {
      apiKey: getRequiredEnv(env, "GOOGLE_ROUTES_API_KEY")
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
