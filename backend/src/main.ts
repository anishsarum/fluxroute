import { PrismaClient } from "@prisma/client";
import { GetCommuteSummary } from "./application/get-commute-summary.js";
import { GetRouteSettings } from "./application/get-route-settings.js";
import { ListCommuteRecords } from "./application/list-commute-records.js";
import { RecordCommuteSnapshot } from "./application/record-commute-snapshot.js";
import { UpdateRouteSettings } from "./application/update-route-settings.js";
import { loadConfig } from "./config/env.js";
import { GoogleRoutesClient } from "./infrastructure/google-routes-client.js";
import { buildHttpServer } from "./infrastructure/http-server.js";
import { PrismaCommuteRecordRepository } from "./infrastructure/prisma-commute-record-repository.js";
import { PrismaRouteSettingsRepository } from "./infrastructure/prisma-route-settings-repository.js";
import { startCommutePolling } from "./infrastructure/cron-scheduler.js";

const config = loadConfig();
const prisma = new PrismaClient();
const commuteRecordRepository = new PrismaCommuteRecordRepository(prisma);
const routeSettingsRepository = new PrismaRouteSettingsRepository(prisma);

const recordCommuteSnapshot = new RecordCommuteSnapshot(
  new GoogleRoutesClient(config.googleRoutes),
  routeSettingsRepository,
  config.routeSettings,
  commuteRecordRepository
);
const listCommuteRecords = new ListCommuteRecords(commuteRecordRepository);
const getCommuteSummary = new GetCommuteSummary(commuteRecordRepository);
const getRouteSettings = new GetRouteSettings(routeSettingsRepository, config.routeSettings);
const updateRouteSettings = new UpdateRouteSettings(routeSettingsRepository);

startCommutePolling(async () => {
  const record = await recordCommuteSnapshot.execute();

  console.log(
    `Saved commute record ${record.id}: traffic=${record.durationInTraffic}m static=${record.staticDuration}m`
  );
}, config.timezone);

console.log("Commute tracker started. Polling every 2 minutes, Mon-Fri, 7am-9am.");

const httpServer = await buildHttpServer({
  listCommuteRecords,
  getCommuteSummary,
  recordCommuteSnapshot,
  getRouteSettings,
  updateRouteSettings
});

await httpServer.listen({
  host: "0.0.0.0",
  port: config.port
});

process.on("SIGINT", async () => {
  await httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await httpServer.close();
  await prisma.$disconnect();
  process.exit(0);
});
