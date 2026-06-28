import { handleRoute, ok, unauthorized, badRequest } from "@/shared/api/http";
import { getQStashClient } from "@/shared/server/qstash";

/**
 * Manage the QStash schedule that drives the workflow scheduler.
 *
 * QStash calls `/api/cron` on a fixed cron (every minute), which in turn runs
 * due `schedule_trigger` workflows and polling triggers. This replaces the
 * GitHub Actions approach (which had a 5-minute floor and proved unreliable).
 *
 * All methods are protected by the shared `CRON_SECRET`:
 *   POST   /api/scheduler/setup?secret=...   create/refresh the schedule
 *   GET    /api/scheduler/setup?secret=...   list current schedules
 *   DELETE /api/scheduler/setup?secret=...&scheduleId=...   remove a schedule
 */

const SCHEDULE_CRON = "*/2 * * * *";

function assertSecret(request: Request): string | null {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return null;
  }

  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ??
    (request.headers.get("authorization") ?? "").replace("Bearer ", "");

  return provided === cronSecret ? null : "Invalid CRON secret";
}

/** Builds the absolute destination URL that QStash should call each tick. */
function buildCronDestination(): string {
  const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const cronSecret = process.env.CRON_SECRET ?? "";

  const query = cronSecret ? `?secret=${encodeURIComponent(cronSecret)}` : "";

  return `${appUrl}/api/cron${query}`;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const secretError = assertSecret(request);

    if (secretError) {
      return unauthorized(secretError);
    }

    if (!process.env.APP_URL) {
      return badRequest("APP_URL is not set — required to create a schedule");
    }

    const client = getQStashClient();
    const destination = buildCronDestination();

    /**
     * Idempotency: remove any existing schedules that target /api/cron before
     * creating a fresh one. Without this, repeat setup calls (e.g. retries
     * after a 401/405) leave multiple heartbeats that all fire the cron,
     * causing duplicate workflow runs.
     */
    const existing = await client.schedules.list();

    const staleSchedules = existing.filter((schedule) =>
      schedule.destination.includes("/api/cron"),
    );

    for (const schedule of staleSchedules) {
      await client.schedules.delete(schedule.scheduleId);
    }

    const { scheduleId } = await client.schedules.create({
      destination,
      cron: SCHEDULE_CRON,
    });

    return ok(
      {
        scheduleId,
        destination,
        cron: SCHEDULE_CRON,
        removedStale: staleSchedules.length,
      },
      "QStash schedule created successfully",
    );
  });
}

export async function GET(request: Request) {
  return handleRoute(async () => {
    const secretError = assertSecret(request);

    if (secretError) {
      return unauthorized(secretError);
    }

    const client = getQStashClient();
    const schedules = await client.schedules.list();

    return ok({ schedules, count: schedules.length }, "QStash schedule list");
  });
}

export async function DELETE(request: Request) {
  return handleRoute(async () => {
    const secretError = assertSecret(request);

    if (secretError) {
      return unauthorized(secretError);
    }

    const url = new URL(request.url);
    const scheduleId = url.searchParams.get("scheduleId");

    if (!scheduleId) {
      return badRequest("The scheduleId parameter is required");
    }

    const client = getQStashClient();
    await client.schedules.delete(scheduleId);

    return ok({ scheduleId }, "QStash schedule deleted successfully");
  });
}
