"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion-presets";
import { useWorkflowListStore } from "@/entities/workflow";
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
 * Render interaktif dashboard. Mengambil daftar workflow nyata dari store untuk
 * kartu statistik & Recent Workflows; metrik lain memakai data dummy
 * representatif (sesuai kesepakatan) hingga backend menyediakannya.
 */
export function DashboardClient({ name }: DashboardClientProps) {
  const { workflows, fetchWorkflows } = useWorkflowListStore();

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const activeWorkflows = workflows.filter(
    (workflow) => workflow.isPublished,
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <DashboardGreeting name={name} />

      <DashboardOverviewPanel />

      <DashboardStatsCards
        activeWorkflows={activeWorkflows || workflows.length}
        credentials={8}
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
          <DashboardRecentExecutions />
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
