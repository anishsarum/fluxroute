import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import type { GetCommuteSummary } from "../application/get-commute-summary.js";
import type { ListCommuteRecords } from "../application/list-commute-records.js";

type HttpServerDependencies = {
  listCommuteRecords: ListCommuteRecords;
  getCommuteSummary: GetCommuteSummary;
  logger?: boolean;
};

export async function buildHttpServer({
  listCommuteRecords,
  getCommuteSummary,
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

  app.get<{ Querystring: { limit?: string } }>("/commute-records", async (request) => {
    return listCommuteRecords.execute(parseLimit(request.query.limit));
  });

  app.get<{ Querystring: { limit?: string } }>("/commute-records/summary", async (request) => {
    return getCommuteSummary.execute(parseLimit(request.query.limit));
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
