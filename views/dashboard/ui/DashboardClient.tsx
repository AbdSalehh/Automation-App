"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion-presets";
import { useWorkflowListStore } from "@/entities/workflow";
import { useMetricsStore } from "@/entities/metrics";
import {
  DashboardGreeting,
  DashboardCacheCard,
  DashboardIntegrationsBar,
} from "./DashboardWidgets";
import { DashboardOverviewPanel } from "./DashboardOverviewPanel";
import { DashboardStatsCards } from "./DashboardStatsCards";
import {
  DashboardRecentWorkflows,
  DashboardRecentExecutions,
  DashboardCredentials,
} from "./DashboardLists";

interface DashboardClientProps {
  name: string;
}

/**
 * Render interaktif dashboard. Mengambil daftar workflow dan metrik nyata dari
 * store untuk kartu statistik, tren eksekusi, dan daftar eksekusi terbaru.
 */
export function DashboardClient({ name }: DashboardClientProps) {
  const { workflows, fetchWorkflows } = useWorkflowListStore();
  const { dashboard, fetchDashboardMetrics } = useMetricsStore();

  useEffect(() => {
    fetchWorkflows();
    fetchDashboardMetrics();
  }, [fetchWorkflows, fetchDashboardMetrics]);

  const executionTrend =
    dashboard?.dailyTrend.map((point) => point.total) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <DashboardGreeting name={name} />

      <DashboardOverviewPanel />

      <DashboardStatsCards
        activeWorkflows={dashboard?.activeWorkflows ?? 0}
        credentials={dashboard?.credentials ?? 0}
        executionsToday={dashboard?.executionsToday ?? 0}
        successRate={dashboard?.successRate ?? 0}
        executionTrend={executionTrend}
      />

      <motion.div
        className="grid gap-5 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          <DashboardRecentWorkflows workflows={workflows} />
        </motion.div>
        <motion.div variants={staggerItem}>
          <DashboardRecentExecutions
            executions={dashboard?.recentExecutions ?? []}
          />
        </motion.div>
        <motion.div variants={staggerItem} className="flex flex-col gap-5">
          <DashboardCredentials />
          <DashboardCacheCard />
        </motion.div>
      </motion.div>

      <DashboardIntegrationsBar />
    </div>
  );
}
