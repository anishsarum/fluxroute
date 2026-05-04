import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { GetCommuteSummary } from "../application/get-commute-summary.js";
import type { GetRouteSettings } from "../application/get-route-settings.js";
import type { ListCommuteRecords } from "../application/list-commute-records.js";
import { normalizeCaptureSourceFilter, toCommuteRecordView } from "../application/list-commute-records.js";
import type { RecordCommuteSnapshot } from "../application/record-commute-snapshot.js";
import type { UpdateRouteSettings } from "../application/update-route-settings.js";
import type { RouteSettings } from "../domain/route-settings.js";

type HttpServerDependencies = {
  listCommuteRecords: ListCommuteRecords;
  getCommuteSummary: GetCommuteSummary;
  recordCommuteSnapshot: RecordCommuteSnapshot;
  getRouteSettings: GetRouteSettings;
  updateRouteSettings: UpdateRouteSettings;
  logger?: boolean;
};

export async function buildHttpServer({
  listCommuteRecords,
  getCommuteSummary,
  recordCommuteSnapshot,
  getRouteSettings,
  updateRouteSettings,
  logger = true
}: HttpServerDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger
  });

  await app.register(cors, {
    origin: true
  });

  app.get("/health", async () => ({
    status: "ok"
  }));

  app.get("/route-settings/current", async () => getRouteSettings.execute());

  app.put<{ Body: RouteSettings }>("/route-settings/current", async (request, reply) => {
    try {
      return await updateRouteSettings.execute(request.body);
    } catch (error) {
      reply.code(400);

      return {
        message: error instanceof Error ? error.message : "Invalid route settings"
      };
    }
  });

  app.get<{ Querystring: { limit?: string; captureSource?: string } }>("/commute-records", async (request) => {
    return listCommuteRecords.execute(
      parseLimit(request.query.limit),
      normalizeCaptureSourceFilter(request.query.captureSource)
    );
  });

  app.post("/commute-records/collect", async () => {
    const record = await recordCommuteSnapshot.execute("manual");

    return toCommuteRecordView(record);
  });

  app.get<{ Querystring: { limit?: string; captureSource?: string } }>("/commute-records/summary", async (request) => {
    return getCommuteSummary.execute(
      parseLimit(request.query.limit),
      normalizeCaptureSourceFilter(request.query.captureSource)
    );
  });

  return app;
}

function parseLimit(limit: string | undefined): number | undefined {
  if (!limit) {
    return undefined;
  }

  const parsedLimit = Number(limit);

  return Number.isFinite(parsedLimit) ? parsedLimit : undefined;
}
