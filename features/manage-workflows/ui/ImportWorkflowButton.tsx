"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { Button, Spinner, toast } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { useWorkflowListStore } from "@/entities/workflow";
import { parseWorkflowFile } from "@/widgets/workflow-list";

interface ImportWorkflowButtonProps {
  /** Buka editor setelah impor berhasil (default: false untuk dashboard). */
  openAfterImport?: boolean;
  variant?: "default" | "outline" | "ghost";
}

/**
 * Tombol impor workflow dari berkas JSON. Membaca berkas terpilih, memvalidasi
 * strukturnya, lalu membuat workflow baru lewat store. State loading impor
 * dikelola di store sesuai aturan proyek.
 */
export function ImportWorkflowButton({
  openAfterImport = false,
  variant = "outline",
}: ImportWorkflowButtonProps) {
  const router = useRouter();

  const { importWorkflow, isImporting } = useWorkflowListStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    changeEvent: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = changeEvent.target.files?.[0];

    /** Reset agar memilih berkas yang sama dua kali tetap memicu onChange. */
    changeEvent.target.value = "";

    if (!file) {
      return;
    }

    try {
      const transfer = await parseWorkflowFile(file);

      const createdWorkflowId = await importWorkflow(transfer);

      if (!createdWorkflowId) {
        toast.error("Gagal mengimpor workflow");
        return;
      }

      toast.success("Workflow berhasil diimpor", {
        description: transfer.name,
      });

      if (openAfterImport) {
        router.push(ROUTES.workflow(createdWorkflowId));
      }
    } catch (error) {
      toast.error("Berkas workflow tidak valid", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant={variant}
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
      >
        {isImporting ? <Spinner /> : <UploadIcon />}
        Import Workflow
      </Button>
    </>
  );
}
