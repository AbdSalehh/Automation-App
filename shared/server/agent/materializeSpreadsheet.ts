import { runSingleNode } from "@/shared/server/engine";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Materialisasi spreadsheet baru untuk workflow yang dibangun agen.
 *
 * Saat agen membangun workflow dengan node `google_sheets_create` mode
 * `new_spreadsheet`, definisi node-nya saja tidak cukup: spreadsheet belum
 * benar-benar ada dan node lain masih memakai placeholder `{{spreadsheetId}}`.
 * Helper ini menjalankan node create lebih dulu (membuat spreadsheet sungguhan
 * beserta header + data dummy), lalu menanam `spreadsheetId` asli ke seluruh
 * node terkait. Node create kemudian diubah ke mode `new_sheet` agar eksekusi
 * berikutnya tidak membuat spreadsheet ganda.
 *
 * Server-only module.
 */

/** Penanda placeholder spreadsheetId lama yang dihasilkan builder. */
const SPREADSHEET_PLACEHOLDER = "{{spreadsheetId}}";

interface MaterializeResult {
  nodes: FlowNode[];
  spreadsheetUrl: string | null;
}

/**
 * Mengganti referensi spreadsheetId pada satu node dengan ID asli. Mengenali dua
 * pola: placeholder lama `{{spreadsheetId}}` dan referensi antar-node berbasis
 * ref node create (mis. `{{n2.spreadsheetId}}`). Node yang tidak memakai salah
 * satu pola dibiarkan apa adanya.
 */
function applySpreadsheetId(
  node: FlowNode,
  spreadsheetId: string,
  createNodeRef: string | undefined,
): FlowNode {
  const currentValue = String(node.data.config?.spreadsheetId ?? "").trim();

  const refReference = createNodeRef
    ? `{{${createNodeRef}.spreadsheetId}}`
    : null;

  const isPlaceholder = currentValue === SPREADSHEET_PLACEHOLDER;
  const isRefReference = refReference !== null && currentValue === refReference;

  if (!isPlaceholder && !isRefReference) {
    return node;
  }

  return {
    ...node,
    data: {
      ...node.data,
      config: { ...node.data.config, spreadsheetId },
    },
  };
}

/**
 * Menjalankan node `google_sheets_create` (mode `new_spreadsheet`) pertama yang
 * punya kredensial, lalu menyebarkan `spreadsheetId` asli ke node lain.
 *
 * Bila tidak ada node create spreadsheet baru, atau kredensial Google belum
 * terpasang, nodes dikembalikan tanpa perubahan (fail-open) agar pembuatan
 * workflow tetap berhasil.
 */
export async function materializeSpreadsheet(
  nodes: FlowNode[],
  ownerId: string,
  workflowId: string,
): Promise<MaterializeResult> {
  const createNode = nodes.find(
    (node) =>
      node.data.kind === "google_sheets_create" &&
      String(node.data.config?.mode ?? "new_spreadsheet") ===
        "new_spreadsheet" &&
      Boolean(node.data.credentialId),
  );

  if (!createNode) {
    return { nodes, spreadsheetUrl: null };
  }

  const outcome = await runSingleNode(workflowId, ownerId, createNode, null);

  if (!outcome.ok || !outcome.output || typeof outcome.output !== "object") {
    return { nodes, spreadsheetUrl: null };
  }

  const createResult = outcome.output as {
    spreadsheetId?: string;
    spreadsheetUrl?: string;
  };

  const spreadsheetId = createResult.spreadsheetId?.trim();

  if (!spreadsheetId) {
    return { nodes, spreadsheetUrl: null };
  }

  /**
   * Tanam ID asli ke semua node, dan ubah node create menjadi mode `new_sheet`
   * (memakai ID yang sama) agar tidak membuat spreadsheet baru saat workflow
   * dijalankan ulang.
   */
  const updatedNodes = nodes.map((node) => {
    if (node.id === createNode.id) {
      return {
        ...node,
        data: {
          ...node.data,
          config: {
            ...node.data.config,
            mode: "new_sheet",
            spreadsheetId,
          },
        },
      };
    }

    return applySpreadsheetId(node, spreadsheetId, createNode.data.ref);
  });

  return {
    nodes: updatedNodes,
    spreadsheetUrl:
      createResult.spreadsheetUrl ??
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}
