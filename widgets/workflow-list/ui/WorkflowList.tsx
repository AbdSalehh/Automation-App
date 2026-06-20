"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { LayoutGridIcon, ListIcon } from "lucide-react";
import { staggerContainer } from "@/shared/lib/motion-presets";
import { cn } from "@/shared/lib/utils";
import { useWorkflowListStore } from "@/entities/workflow";
import { CreateWorkflowButton } from "@/features/manage-workflows";
import { WorkflowStatsCards } from "./WorkflowStatsCards";
import { WorkflowFilterBar, type WorkflowFilters } from "./WorkflowFilterBar";
import { WorkflowTableRow } from "./WorkflowTableRow";
import {
  deriveWorkflowMetrics,
  summarizeWorkflows,
} from "../lib/workflowMetrics";

const INITIAL_FILTERS: WorkflowFilters = {
  search: "",
  status: "all",
  triggerType: "all",
  sort: "latest",
};

const TABLE_HEADERS = [
  "Workflow",
  "Trigger",
  "Last Execution",
  "Status",
  "Executions",
  "Updated",
  "",
];

export function WorkflowList() {
  const {
    workflows,
    fetchWorkflows,
    isLoading,
    errorMessage,
    removeWorkflow,
    subscribeRealtime,
    unsubscribeRealtime,
  } = useWorkflowListStore();

  const { data: session } = useSession();

  const sessionId = session?.user?.id ?? "";

  const [filters, setFilters] = useState<WorkflowFilters>(INITIAL_FILTERS);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  /**
   * Berlangganan event `workflow-update` selama halaman terbuka agar perubahan
   * dari agen Telegram maupun tab lain langsung tersinkron tanpa refresh.
   */
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    subscribeRealtime(sessionId);

    return () => {
      unsubscribeRealtime();
    };
  }, [sessionId, subscribeRealtime, unsubscribeRealtime]);

  const summary = useMemo(() => summarizeWorkflows(workflows), [workflows]);

  const filteredWorkflows = useMemo(() => {
    const matched = workflows.filter((workflow) => {
      const metrics = deriveWorkflowMetrics(workflow);

      const matchesSearch = workflow.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" || metrics.status === filters.status;

      const matchesTrigger =
        filters.triggerType === "all" ||
        metrics.triggerType === filters.triggerType;

      return matchesSearch && matchesStatus && matchesTrigger;
    });

    if (filters.sort === "name") {
      return [...matched].sort((first, second) =>
        first.name.localeCompare(second.name),
      );
    }

    if (filters.sort === "executions") {
      return [...matched].sort(
        (first, second) =>
          deriveWorkflowMetrics(second).executions -
          deriveWorkflowMetrics(first).executions,
      );
    }

    return matched;
  }, [workflows, filters]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground text-sm">
            Kelola, jalankan, dan monitor semua workflow automasi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CreateWorkflowButton />
          <div className="border-border hidden items-center rounded-lg border p-0.5 sm:flex">
            <span className="bg-accent text-foreground grid size-8 place-items-center rounded-md">
              <ListIcon className="size-4" />
            </span>
            <span className="text-muted-foreground grid size-8 place-items-center rounded-md">
              <LayoutGridIcon className="size-4" />
            </span>
          </div>
        </div>
      </div>

      <WorkflowStatsCards
        total={summary.total}
        active={summary.active}
        draft={summary.draft}
        totalExecutions={summary.totalExecutions}
      />

      <WorkflowFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(INITIAL_FILTERS)}
      />

      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_unused, index) => (
            <div
              key={index}
              className="bg-muted h-16 animate-pulse rounded-xl"
            />
          ))}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed py-16 text-center">
          Tidak ada workflow yang cocok dengan filter.
        </div>
      ) : (
        <div className="border-border bg-card overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-border bg-muted/40 border-b">
                  {TABLE_HEADERS.map((header, index) => (
                    <th
                      key={header || index}
                      className={cn(
                        "text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase",
                        index === TABLE_HEADERS.length - 1 && "text-right",
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <motion.tbody
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {filteredWorkflows.map((workflow) => (
                  <WorkflowTableRow
                    key={workflow.id}
                    workflow={workflow}
                    onRemove={removeWorkflow}
                  />
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
