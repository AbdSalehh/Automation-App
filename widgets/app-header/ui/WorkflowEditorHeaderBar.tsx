"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeftIcon,
  PlayIcon,
  InfoIcon,
  SettingsIcon,
  ScrollTextIcon,
} from "lucide-react";
import { Button, Badge, Spinner, toast } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { useWorkflowStore } from "@/entities/workflow";
import { useWhatsappSessionStore } from "@/entities/whatsapp-session";
import { WorkflowLogsSheet } from "@/widgets/execution-history";

/**
 * Renders workflow editor toolbar controls inside the shared AppHeader.
 * Only visible when the current pathname matches /workflows/[id].
 * Uses usePathname() (client-side) to detect the editor context, then reads
 * the workflow Zustand store for name, status, and actions.
 */
export function WorkflowEditorHeaderBar() {
  const pathname = usePathname();

  const isEditorPage = /^\/workflows\/[^/]+$/.test(pathname ?? "");

  const {
    workflowId,
    name,
    isDirty,
    isExecuting,
    errorMessage,
    executeWorkflow,
    nodes,
  } = useWorkflowStore();

  const { checkIsSessionActive } = useWhatsappSessionStore();

  const [isLogsOpen, setIsLogsOpen] = useState(false);

  if (!isEditorPage) {
    return null;
  }

  /**
   * Menjalankan workflow. Bila terdapat node kirim/terima pesan WhatsApp yang
   * memakai Baileys, sesi WhatsApp diperiksa lebih dulu. Jika sesi sudah habis,
   * pengguna diberi tahu lewat toast agar login ulang dan workflow tidak
   * dijalankan.
   */
  const handleRun = async () => {
    const hasBaileysWhatsappNode = nodes.some((node) => {
      if (node.data.kind === "whatsapp_trigger") {
        return true;
      }

      if (node.data.kind === "whatsapp_send") {
        const provider = String(node.data.config?.provider ?? "baileys");
        return provider === "baileys";
      }

      return false;
    });

    if (hasBaileysWhatsappNode) {
      const isSessionActive = await checkIsSessionActive();

      if (!isSessionActive) {
        toast.warning("Sesi WhatsApp sudah habis", {
          description:
            "Hubungkan ulang WhatsApp di halaman Credentials sebelum menjalankan workflow ini.",
        });

        return;
      }
    }

    await executeWorkflow();
  };

  return (
    <div className="flex flex-1 items-center gap-3">
      <div className="bg-border h-5 w-px" />

      <Link href={ROUTES.workflows}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Kembali ke Workflows"
        >
          <ChevronLeftIcon />
        </Button>
      </Link>

      <div className="flex min-w-0 flex-col">
        <span className="text-foreground truncate text-sm font-semibold">
          {name || "Untitled Workflow"}
        </span>
        <span className="text-muted-foreground text-xs">Overview workflow</span>
      </div>

      {isDirty && <Badge variant="warning">Belum disimpan</Badge>}

      {errorMessage && (
        <span className="text-destructive max-w-xs truncate text-sm">
          {errorMessage}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={isExecuting}
          onClick={handleRun}
        >
          {isExecuting ? <Spinner /> : <PlayIcon />}
          Run
        </Button>

        {workflowId && (
          <Button variant="ghost" size="sm" onClick={() => setIsLogsOpen(true)}>
            <ScrollTextIcon />
            Logs
          </Button>
        )}

        <Button variant="ghost" size="icon-sm" aria-label="Info">
          <InfoIcon />
        </Button>

        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <SettingsIcon />
        </Button>
      </div>

      {workflowId && (
        <WorkflowLogsSheet
          workflowId={workflowId}
          open={isLogsOpen}
          onOpenChange={setIsLogsOpen}
        />
      )}
    </div>
  );
}
