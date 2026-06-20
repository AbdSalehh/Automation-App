import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok } from "@/shared/api/http";

/**
 * Bentuk satu titik tren eksekusi harian untuk grafik di dashboard.
 */
interface DailyExecutionPoint {
  date: string;
  total: number;
  success: number;
}

/**
 * Satu baris eksekusi terbaru yang ditampilkan di kartu "Recent Executions".
 */
interface RecentExecution {
  id: string;
  workflowName: string;
  status: string;
  startedAt: string;
  nodeCount: number;
}

/** Awal hari ini (UTC) sebagai patokan agregasi "hari ini". */
function startOfTodayUtc(): Date {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * GET /api/metrics/dashboard — agregat metrik nyata untuk dashboard:
 * jumlah workflow aktif, kredensial, eksekusi hari ini & bulan ini, success
 * rate, tren 7 hari terakhir, dan daftar eksekusi terbaru.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const todayStart = startOfTodayUtc();

    const monthStart = new Date(
      Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1),
    );

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    /** Hanya eksekusi milik workflow user yang dihitung. */
    const ownedWorkflowFilter = { workflow: { ownerId: user.id } };

    const [
      activeWorkflows,
      totalWorkflows,
      credentialCount,
      executionsToday,
      executionsThisMonth,
      successThisMonth,
      recentRecords,
      trendRecords,
    ] = await Promise.all([
      prisma.workflow.count({
        where: { ownerId: user.id, isPublished: true },
      }),
      prisma.workflow.count({ where: { ownerId: user.id } }),
      prisma.credential.count({ where: { userId: user.id } }),
      prisma.execution.count({
        where: { ...ownedWorkflowFilter, startedAt: { gte: todayStart } },
      }),
      prisma.execution.count({
        where: { ...ownedWorkflowFilter, startedAt: { gte: monthStart } },
      }),
      prisma.execution.count({
        where: {
          ...ownedWorkflowFilter,
          status: "success",
          startedAt: { gte: monthStart },
        },
      }),
      prisma.execution.findMany({
        where: ownedWorkflowFilter,
        orderBy: { startedAt: "desc" },
        take: 5,
        include: { workflow: { select: { name: true, nodes: true } } },
      }),
      prisma.execution.findMany({
        where: { ...ownedWorkflowFilter, startedAt: { gte: sevenDaysAgo } },
        select: { startedAt: true, status: true },
      }),
    ]);

    const successRate =
      executionsThisMonth > 0
        ? Math.round((successThisMonth / executionsThisMonth) * 1000) / 10
        : 0;

    /** Susun tren 7 hari, mengisi hari tanpa eksekusi dengan nol. */
    const dailyTrend: DailyExecutionPoint[] = Array.from(
      { length: 7 },
      (_unused, dayOffset) => {
        const day = new Date(sevenDaysAgo);
        day.setUTCDate(day.getUTCDate() + dayOffset);

        const dayKey = day.toISOString().slice(0, 10);

        const dayRecords = trendRecords.filter(
          (record) => record.startedAt.toISOString().slice(0, 10) === dayKey,
        );

        return {
          date: dayKey,
          total: dayRecords.length,
          success: dayRecords.filter((record) => record.status === "success")
            .length,
        };
      },
    );

    const recentExecutions: RecentExecution[] = recentRecords.map((record) => ({
      id: record.id,
      workflowName: record.workflow.name,
      status: record.status,
      startedAt: record.startedAt.toISOString(),
      nodeCount: (JSON.parse(record.workflow.nodes || "[]") as unknown[])
        .length,
    }));

    return ok(
      {
        activeWorkflows,
        totalWorkflows,
        credentials: credentialCount,
        executionsToday,
        executionsThisMonth,
        successRate,
        dailyTrend,
        recentExecutions,
      },
      "Metrik dashboard berhasil diambil",
    );
  });
}
