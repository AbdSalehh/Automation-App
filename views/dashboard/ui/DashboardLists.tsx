"use client";

import Link from "next/link";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  GlobeIcon,
  SheetIcon,
} from "lucide-react";
import { Badge, BrandIcon } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import type { WorkflowSummary } from "@/entities/workflow";
import { deriveWorkflowMetrics } from "@/widgets/workflow-list";

interface DashboardRecentWorkflowsProps {
  workflows: WorkflowSummary[];
}

const TRIGGER_ICONS: Record<string, typeof ClockIcon> = {
  Cron: ClockIcon,
  Webhook: GlobeIcon,
  "Google Sheets": SheetIcon,
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  paused: "warning",
  draft: "neutral",
};

/** Kartu "Recent Workflows" pada dashboard. */
export function DashboardRecentWorkflows({
  workflows,
}: DashboardRecentWorkflowsProps) {
  const recent = workflows.slice(0, 5);

  return (
    <CardShell title="Recent Workflows" href={ROUTES.workflows}>
      {recent.length === 0 ? (
        <EmptyRow label="Belum ada workflow." />
      ) : (
        recent.map((workflow) => {
          const metrics = deriveWorkflowMetrics(workflow);
          const TriggerIcon = TRIGGER_ICONS[metrics.triggerType] ?? ClockIcon;

          return (
            <Link
              key={workflow.id}
              href={ROUTES.workflow(workflow.id)}
              className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-100 text-orange-600">
                <TriggerIcon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-foreground truncate text-sm font-medium">
                  {workflow.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {metrics.triggerType} · {metrics.triggerDetail}
                </span>
              </div>
              <Badge variant={STATUS_VARIANT[metrics.status]}>
                {metrics.status === "active"
                  ? "Active"
                  : metrics.status === "paused"
                    ? "Paused"
                    : "Draft"}
              </Badge>
            </Link>
          );
        })
      )}
    </CardShell>
  );
}

/** Kartu "Recent Executions" pada dashboard (data dummy representatif). */
export function DashboardRecentExecutions() {
  const executions = [
    {
      name: "Invoice Reminder",
      id: "#2578",
      steps: 12,
      ok: true,
      time: "2m ago",
    },
    { name: "Lead Sync", id: "#2577", steps: 8, ok: false, time: "5m ago" },
    {
      name: "Customer Followup",
      id: "#2576",
      steps: 10,
      ok: true,
      time: "15m ago",
    },
    {
      name: "Sales Report Daily",
      id: "#2575",
      steps: 7,
      ok: true,
      time: "1h ago",
    },
    { name: "Lead Capture", id: "#2574", steps: 6, ok: true, time: "2h ago" },
  ];

  return (
    <CardShell title="Recent Executions" href={ROUTES.executions}>
      {executions.map((execution) => (
        <div
          key={execution.id}
          className="flex items-center gap-3 rounded-lg px-2 py-2"
        >
          {execution.ok ? (
            <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
          ) : (
            <XCircleIcon className="size-5 shrink-0 text-red-500" />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-foreground truncate text-sm font-medium">
              {execution.name}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {execution.id} · {execution.steps} steps
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <Badge variant={execution.ok ? "success" : "destructive"}>
              {execution.ok ? "Success" : "Error"}
            </Badge>
            <span className="text-muted-foreground text-[10px]">
              {execution.time}
            </span>
          </div>
        </div>
      ))}
    </CardShell>
  );
}

/** Kartu "Encrypted Credentials" pada dashboard (data dummy representatif). */
export function DashboardCredentials() {
  const credentials = [
    { name: "Google Service Account", brand: "google-sheets" as const },
    { name: "WhatsApp Business", brand: "whatsapp" as const },
    { name: "Gmail SMTP", brand: "gmail" as const },
    { name: "Telegram Bot", brand: "telegram" as const },
  ];

  return (
    <CardShell title="Encrypted Credentials" href={ROUTES.credentials}>
      {credentials.map((credential) => (
        <div
          key={credential.name}
          className="flex items-center gap-3 rounded-lg px-2 py-2"
        >
          <BrandIcon name={credential.brand} className="size-5 shrink-0" />
          <span className="text-foreground flex-1 truncate text-sm font-medium">
            {credential.name}
          </span>
          <span className="text-muted-foreground font-mono text-xs tracking-widest">
            ••••••••
          </span>
          <Badge variant="success">AES-256-GCM</Badge>
        </div>
      ))}
    </CardShell>
  );
}

/** Kerangka kartu list dengan judul + tautan "View all". */
function CardShell({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        <Link
          href={href}
          className="text-xs font-medium text-orange-500 hover:text-orange-600"
        >
          View all
        </Link>
      </div>
      <div className={cn("flex flex-col gap-1")}>{children}</div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="text-muted-foreground px-2 py-6 text-center text-sm">
      {label}
    </p>
  );
}
