"use client";

import Link from "next/link";
import {
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  GlobeIcon,
  SheetIcon,
} from "lucide-react";
import { Badge, BrandIcon, type BrandIconName } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import { formatDateTime } from "@/shared/lib/formatDate";
import type { WorkflowSummary } from "@/entities/workflow";
import type { RecentExecution } from "@/entities/metrics";
import { deriveWorkflowMetrics } from "@/widgets/workflow-list";

interface DashboardRecentWorkflowsProps {
  workflows: WorkflowSummary[];
}

const TRIGGER_ICONS: Record<string, typeof ClockIcon> = {
  Cron: ClockIcon,
  Webhook: GlobeIcon,
  "Google Sheets": SheetIcon,
};

const STATUS_VARIANT: Record<string, "success" | "neutral"> = {
  active: "success",
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
                {metrics.status === "active" ? "Active" : "Draft"}
              </Badge>
            </Link>
          );
        })
      )}
    </CardShell>
  );
}

interface DashboardRecentExecutionsProps {
  executions: RecentExecution[];
}

/** Kartu "Recent Executions" pada dashboard (data nyata dari metrics store). */
export function DashboardRecentExecutions({
  executions,
}: DashboardRecentExecutionsProps) {
  return (
    <CardShell title="Recent Executions">
      {executions.length === 0 ? (
        <EmptyRow label="Belum ada eksekusi." />
      ) : (
        executions.map((execution) => {
          const isSuccess = execution.status === "success";
          const isRunning = execution.status === "running";

          return (
            <div
              key={execution.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              {isSuccess ? (
                <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
              ) : isRunning ? (
                <ClockIcon className="size-5 shrink-0 text-amber-500" />
              ) : (
                <XCircleIcon className="size-5 shrink-0 text-red-500" />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-foreground truncate text-sm font-medium">
                  {execution.workflowName}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {execution.nodeCount} steps
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <Badge
                  variant={
                    isSuccess
                      ? "success"
                      : isRunning
                        ? "warning"
                        : "destructive"
                  }
                >
                  {isSuccess ? "Success" : isRunning ? "Running" : "Error"}
                </Badge>
                <span className="text-muted-foreground text-[10px]">
                  {formatDateTime(execution.startedAt)}
                </span>
              </div>
            </div>
          );
        })
      )}
    </CardShell>
  );
}

interface DashboardCredentialItem {
  id: string;
  type: string;
  name: string;
}

interface DashboardCredentialsProps {
  credentials: DashboardCredentialItem[];
}

/**
 * Memetakan tipe kredensial ke ikon brand yang tersedia di `shared/ui`. Tipe
 * yang tidak punya ikon khusus jatuh ke ikon webhook generik.
 */
const CREDENTIAL_TYPE_ICON: Record<string, BrandIconName> = {
  whatsapp: "whatsapp",
  whatsapp_oauth: "whatsapp",
  telegram: "telegram",
  telegram_personal: "telegram",
  agent_chat: "telegram",
  gemini: "gemini",
  ai: "openai-chatgpt",
  gmail: "gmail",
  google_oauth: "google-sheets",
  google_service_account: "google-sheets",
  google_calendar: "google-calendar",
  http: "webhook",
};

/** Kartu "Encrypted Credentials" pada dashboard (data nyata). */
export function DashboardCredentials({
  credentials,
}: DashboardCredentialsProps) {
  const recent = credentials.slice(0, 5);

  return (
    <CardShell title="Encrypted Credentials" href={ROUTES.credentials}>
      {recent.length === 0 ? (
        <EmptyRow label="Belum ada kredensial." />
      ) : (
        recent.map((credential) => (
          <div
            key={credential.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2"
          >
            <BrandIcon
              name={CREDENTIAL_TYPE_ICON[credential.type] ?? "webhook"}
              className="size-5 shrink-0"
            />
            <span className="text-foreground flex-1 truncate text-sm font-medium">
              {credential.name}
            </span>
            <span className="text-muted-foreground font-mono text-xs tracking-widest">
              ••••••••
            </span>
            <Badge variant="success">AES-256-GCM</Badge>
          </div>
        ))
      )}
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
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        {href && (
          <Link
            href={href}
            className="text-xs font-medium text-orange-500 hover:text-orange-600"
          >
            View all
          </Link>
        )}
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
