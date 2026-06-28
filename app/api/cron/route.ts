import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok, unauthorized } from "@/shared/api/http";
import { runWorkflow, resumeDueSchedules } from "@/shared/server/engine";
import { lastCronMatchWithin } from "@/shared/server/cron";
import { getRedisClient } from "@/shared/lib/redis";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Scheduler entry point.
 *
 * Designed to be hit once per minute by an external scheduler (Vercel Cron,
 * cron-job.org, GitHub Actions, etc.). On each tick it:
 *
 *  1. Runs published workflows whose `schedule_trigger` cron is due this minute.
 *  2. Polls published workflows with a `google_sheets_trigger` whose polling
 *     interval has elapsed — this is what detects spreadsheet changes and lets
 *     delayed reminders fire / cancel based on the latest data.
 *
 * Protect with a shared secret via the `CRON_SECRET` env var:
 *   GET /api/cron?secret=...   or   Authorization: Bearer <CRON_SECRET>
 */

/**
 * Heartbeat cadence (minutes). The QStash schedule pings every 2 minutes, so we
 * scan a 2-minute window backwards to catch schedule slots that land on a
 * minute the heartbeat skipped.
 */
const CRON_WINDOW_MINUTES = 2;

/**
 * Returns true the first time a given schedule slot is seen for a workflow,
 * recording it in Redis so the same slot never fires twice (e.g. when two
 * overlapping heartbeats both catch it within the window). Falls back to
 * allowing the run when Redis is unavailable.
 */
async function isScheduleSlotNew(
  workflowId: string,
  slotMs: number,
): Promise<boolean> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      return true;
    }

    const key = `sched:fired:${workflowId}:${slotMs}`;
    const stored = await redisClient.set(key, "1", {
      NX: true,
      EX: 6 * 60 * 60,
    });

    return stored === "OK";
  } catch {
    return true;
  }
}

/** Returns true when a polling node is due, updating its last-run timestamp. */
async function isPollingDue(
  workflowId: string,
  intervalSeconds: number,
  now: number,
): Promise<boolean> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      // Without Redis we can't throttle — poll every tick (safe but chatty).
      return true;
    }

    const key = `poll:lastrun:${workflowId}`;
    const lastRun = await redisClient.get(key);

    if (lastRun && now - Number(lastRun) < intervalSeconds * 1000) {
      return false;
    }

    await redisClient.setEx(key, 24 * 60 * 60, String(now));

    return true;
  } catch {
    return true;
  }
}

export async function GET(request: Request) {
  return handleRoute(async () => {
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const url = new URL(request.url);
      const provided =
        url.searchParams.get("secret") ??
        (request.headers.get("authorization") ?? "").replace("Bearer ", "");

      if (provided !== cronSecret) {
        return unauthorized("Invalid CRON secret");
      }
    }

    const now = new Date();
    const nowMs = now.getTime();

    const publishedWorkflows = await prisma.workflow.findMany({
      where: { isPublished: true },
    });

    const triggered: string[] = [];

    for (const workflow of publishedWorkflows) {
      const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");

      // 1. Cron schedule trigger
      const scheduleNode = nodes.find(
        (node) => node.data.kind === "schedule_trigger",
      );

      if (scheduleNode) {
        const cronExpression = String(scheduleNode.data.config?.cron ?? "");

        const matchedSlot = cronExpression
          ? lastCronMatchWithin(cronExpression, now, CRON_WINDOW_MINUTES)
          : null;

        if (matchedSlot !== null) {
          const isNew = await isScheduleSlotNew(workflow.id, matchedSlot);

          if (isNew) {
            const executionId = await runWorkflow(workflow.id, {
              triggeredBy: "schedule",
              at: now.toISOString(),
            });

            triggered.push(executionId);
          }

          continue;
        }
      }

      // 2. Google Sheets polling trigger (change detection + reminder ticks)
      const sheetsTriggerNode = nodes.find(
        (node) => node.data.kind === "google_sheets_trigger",
      );

      if (sheetsTriggerNode) {
        const intervalSeconds = Number(
          sheetsTriggerNode.data.config?.pollingIntervalSeconds ?? 60,
        );

        const due = await isPollingDue(workflow.id, intervalSeconds, nowMs);

        if (due) {
          const executionId = await runWorkflow(workflow.id, {
            triggeredBy: "polling",
            at: now.toISOString(),
          });

          triggered.push(executionId);
        }
      }
    }

    /** Resume paused Schedule nodes whose due time has passed. */
    const resumedSchedules = await resumeDueSchedules();

    return ok(
      {
        triggered,
        count: triggered.length,
        resumedSchedules,
        checkedAt: now.toISOString(),
      },
      `Cron selesai — ${triggered.length} workflow dijalankan, ${resumedSchedules} jadwal dilanjutkan`,
    );
  });
}

// QStash mengirimkan request POST secara default untuk schedulenya
export const POST = GET;
