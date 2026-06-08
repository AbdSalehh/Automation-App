"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { Badge, Button, Card } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { formatDateTime } from "@/shared/lib/formatDate";
import { useWorkflowListStore } from "@/entities/workflow";
import { CreateWorkflowButton } from "@/features/manage-workflows";

export function WorkflowList() {
  const { workflows, fetchWorkflows, isLoading, errorMessage, removeWorkflow } =
    useWorkflowListStore();

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan jalankan automasi berbasis node.
          </p>
        </div>

        <CreateWorkflowButton />
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_unused, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Belum ada workflow. Buat yang pertama.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflows &&
            workflows.map((workflow) => (
              <Card key={workflow.id} className="gap-3 py-4">
                <Link
                  href={ROUTES.workflow(workflow.id)}
                  className="flex flex-col gap-2 px-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {workflow.name}
                    </h3>
                    <Badge
                      variant={workflow.isPublished ? "success" : "neutral"}
                    >
                      {workflow.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {workflow.nodeCount} node · v{workflow.version}
                  </p>

                  <p className="text-xs text-muted-foreground/70">
                    Diperbarui {formatDateTime(workflow.updatedAt)}
                  </p>
                </Link>

                <div className="flex gap-2 px-4">
                  <Link href={ROUTES.workflow(workflow.id)} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Buka Editor
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeWorkflow(workflow.id)}
                    aria-label="Hapus workflow"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
