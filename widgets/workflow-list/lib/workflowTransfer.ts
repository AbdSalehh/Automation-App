import type { FlowNode, FlowEdge } from "@/entities/workflow";

/**
 * Helper ekspor/impor workflow sebagai berkas JSON.
 *
 * Format berkas sederhana dan portabel: hanya menyertakan nama, nodes, dan
 * edges (tanpa id/owner/versi) agar bisa diimpor sebagai workflow baru di akun
 * mana pun.
 */

/** Struktur berkas workflow yang diekspor/diimpor. */
export interface WorkflowTransferFile {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** Penanda format agar berkas impor bisa divalidasi. */
const TRANSFER_KIND = "automation-app/workflow";

interface ExportInput {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/**
 * Mengunduh definisi workflow sebagai berkas `.json` di browser. Membuat Blob
 * lalu memicu unduhan lewat anchor sementara.
 */
export function exportWorkflow(workflow: ExportInput): void {
  const payload = {
    kind: TRANSFER_KIND,
    name: workflow.name,
    nodes: workflow.nodes,
    edges: workflow.edges,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const safeName =
    workflow.name
      .trim()
      .replace(/[^a-z0-9-_]+/gi, "_")
      .toLowerCase() || "workflow";

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}.json`;

  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Membaca dan memvalidasi berkas JSON workflow yang diimpor. Melempar error
 * dengan pesan ramah-pengguna bila format tidak sesuai.
 */
export async function parseWorkflowFile(
  file: File,
): Promise<WorkflowTransferFile> {
  const text = await file.text();

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Berkas bukan JSON yang valid");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Struktur berkas workflow tidak dikenali");
  }

  const record = parsed as Record<string, unknown>;

  if (!Array.isArray(record.nodes) || !Array.isArray(record.edges)) {
    throw new Error("Berkas tidak memuat nodes/edges workflow");
  }

  const importedName =
    typeof record.name === "string" && record.name.trim()
      ? record.name.trim()
      : "Workflow Impor";

  return {
    name: importedName,
    nodes: record.nodes as FlowNode[],
    edges: record.edges as FlowEdge[],
  };
}
