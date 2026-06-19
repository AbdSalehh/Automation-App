"use client";

import Link from "next/link";
import {
  ChevronLeftIcon,
  PlayIcon,
  InfoIcon,
  SettingsIcon,
} from "lucide-react";
import { Button, Badge, Spinner } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { useWorkflowStore } from "@/entities/workflow";

interface WorkflowToolbarProps {
  onRun: () => void;
}

export function WorkflowToolbar({ onRun }: WorkflowToolbarProps) {
  const { name, isDirty, isExecuting, errorMessage } = useWorkflowStore();

  return (
    <div className="border-border bg-card flex h-14 items-center gap-3 border-b px-4">
      <Link href={ROUTES.workflows}>
        <Button variant="ghost" size="icon-sm" aria-label="Kembali">
          <ChevronLeftIcon />
        </Button>
      </Link>

      <div className="flex flex-col">
        <span className="text-foreground text-sm font-semibold">
          {name || "Untitled Workflow"}
        </span>
        <span className="text-muted-foreground text-xs">Overview workflow</span>
      </div>

      {isDirty && <Badge variant="warning">Belum disimpan</Badge>}

      {errorMessage && (
        <span className="text-destructive text-sm">{errorMessage}</span>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={isExecuting}
          onClick={onRun}
        >
          {isExecuting ? <Spinner /> : <PlayIcon />}
          Run
        </Button>

        <Button variant="ghost" size="icon-sm" aria-label="Info">
          <InfoIcon />
        </Button>

        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <SettingsIcon />
        </Button>
      </div>
    </div>
  );
}
