import { PrismaClient } from "@prisma/client";
import { RecordCommuteSnapshot } from "./application/record-commute-snapshot.js";
import { loadConfig } from "./config/env.js";
import { GoogleRoutesClient } from "./infrastructure/google-routes-client.js";
import { PrismaCommuteRecordRepository } from "./infrastructure/prisma-commute-record-repository.js";
import { startCommutePolling } from "./infrastructure/cron-scheduler.js";

const config = loadConfig();
const prisma = new PrismaClient();

const recordCommuteSnapshot = new RecordCommuteSnapshot(
  new GoogleRoutesClient(config.googleRoutes),
  new PrismaCommuteRecordRepository(prisma)
);

startCommutePolling(async () => {
  const record = await recordCommuteSnapshot.execute();

  console.log(
    `Saved commute record ${record.id}: traffic=${record.durationInTraffic}m static=${record.staticDuration}m`
  );
}, config.timezone);

console.log("Commute tracker started. Polling every 2 minutes, Mon-Fri, 7am-9am.");

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
