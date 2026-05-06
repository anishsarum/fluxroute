import cron from "node-cron";

export const commutePollingSchedule = "* 7,8 * * 1-5";

export type CommutePollingJob = () => Promise<void>;

export function startCommutePolling(job: CommutePollingJob, timezone: string): void {
  cron.schedule(
    commutePollingSchedule,
    async () => {
      try {
        await job();
      } catch (error) {
        console.error("Commute polling failed", error);
      }
    },
    { timezone }
  );
}
