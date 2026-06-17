"use client";

import {
  Button,
  Input,
  Textarea,
  Badge,
  Spinner,
  ScrollArea,
} from "@/shared/ui";
import { useWorkflowStore } from "@/entities/workflow";
import { formatDateTime } from "@/shared/lib/formatDate";

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function FlowInfoPanel() {
  const {
    workflowId,
    name,
    isPublished,
    nodes,
    edges,
    isSaving,
    isDirty,
    setName,
    setPublished,
    saveWorkflow,
  } = useWorkflowStore();

  const hasWebhookTrigger = nodes?.some(
    (node) => node.data.kind === "webhook_trigger",
  );

  const scheduleNode = nodes?.find(
    (node) => node.data.kind === "schedule_trigger",
  );

  const webhookUrl =
    workflowId && typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/${workflowId}`
      : "";

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Flow</h2>
        <Badge variant={isPublished ? "success" : "neutral"}>
          {isPublished ? "Active" : "Draft"}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-6 p-4">
          <section className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Info
            </h3>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Name
              </label>
              <Input
                value={name}
                onChange={(changeEvent) => setName(changeEvent.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Textarea rows={2} placeholder="Add a short description..." />
            </div>
          </section>

          <section className="flex flex-col gap-1">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Properties
            </h3>

            <InfoRow label="Type" value="Workflow" />
            <InfoRow label="Status" value={isPublished ? "Enabled" : "Draft"} />
            <InfoRow label="Nodes" value={String(nodes?.length)} />
            <InfoRow label="Connections" value={String(edges?.length)} />
            <InfoRow label="Updated" value={formatDateTime(new Date())} />
          </section>

          <section className="flex flex-col gap-1">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Runtime Settings
            </h3>

            <InfoRow label="Auto-run on trigger" value="On" />
            <InfoRow label="Timeout (ms)" value="3000" />
            <InfoRow label="Retry attempts" value="2" />

            <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(changeEvent) =>
                  setPublished(changeEvent.target.checked)
                }
              />
              Publish workflow
            </label>
          </section>

          {hasWebhookTrigger && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Webhook URL
              </h3>

              <p className="text-xs text-muted-foreground">
                Kirim HTTP POST ke URL ini untuk menjalankan workflow. Body JSON
                akan diteruskan sebagai data trigger.
              </p>

              <code className="block break-all rounded-md bg-muted p-2 text-xs text-foreground">
                {webhookUrl || "Simpan workflow dulu untuk mendapatkan URL"}
              </code>

              {webhookUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                >
                  Salin URL
                </Button>
              )}

              {!isPublished && (
                <p className="text-xs text-amber-600">
                  Publish workflow agar webhook bisa dipanggil.
                </p>
              )}
            </section>
          )}

          {scheduleNode && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Schedule
              </h3>

              <p className="text-xs text-muted-foreground">
                Cron:{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {String(scheduleNode.data.config?.cron ?? "belum diatur")}
                </code>
              </p>

              <p className="text-xs text-muted-foreground">
                Hubungkan scheduler eksternal (Vercel Cron / cron-job.org) ke{" "}
                <code className="rounded bg-muted px-1 py-0.5">/api/cron</code>{" "}
                setiap menit.
              </p>
            </section>
          )}

          <Button
            className="w-full"
            disabled={isSaving || !isDirty}
            onClick={saveWorkflow}
          >
            {isSaving && <Spinner />}
            Save Change
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
}
