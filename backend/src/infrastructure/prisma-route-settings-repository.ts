import type { PrismaClient } from "@prisma/client";
import type { RouteSettingsReader } from "../application/get-route-settings.js";
import type { RouteSettingsWriter } from "../application/update-route-settings.js";
import type { RouteSettings } from "../domain/route-settings.js";

const routeSettingsId = 1;

export class PrismaRouteSettingsRepository implements RouteSettingsReader, RouteSettingsWriter {
  constructor(private readonly prisma: PrismaClient) {}

  async getCurrent(defaultSettings: RouteSettings): Promise<RouteSettings> {
    const existingSettings = await this.prisma.routeSettings.findUnique({
      where: {
        id: routeSettingsId
      }
    });

    if (existingSettings) {
      return toRouteSettings(existingSettings);
    }

    return this.save(defaultSettings);
  }

  async save(routeSettings: RouteSettings): Promise<RouteSettings> {
    const savedSettings = await this.prisma.routeSettings.upsert({
      where: {
        id: routeSettingsId
      },
      create: {
        id: routeSettingsId,
        ...toPrismaRouteSettings(routeSettings)
      },
      update: toPrismaRouteSettings(routeSettings)
    });

    return toRouteSettings(savedSettings);
  }
}

type PrismaRouteSettings = {
  originLabel: string;
  originLatitude: number;
  originLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
};

function toPrismaRouteSettings(routeSettings: RouteSettings): PrismaRouteSettings {
  return {
    originLabel: routeSettings.origin.label,
    originLatitude: routeSettings.origin.latitude,
    originLongitude: routeSettings.origin.longitude,
    destinationLabel: routeSettings.destination.label,
    destinationLatitude: routeSettings.destination.latitude,
    destinationLongitude: routeSettings.destination.longitude
  };
}

function toRouteSettings(routeSettings: PrismaRouteSettings): RouteSettings {
  return {
    origin: {
      label: routeSettings.originLabel,
      latitude: routeSettings.originLatitude,
      longitude: routeSettings.originLongitude
    },
    destination: {
      label: routeSettings.destinationLabel,
      latitude: routeSettings.destinationLatitude,
      longitude: routeSettings.destinationLongitude
    }
  };
}
