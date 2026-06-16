import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/shared/lib/prisma";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { requestExternal } from "@/shared/server/httpClient";
import {
  NODE_TYPES,
  type NodeKind,
} from "@/entities/workflow/model/node.model";
import type {
  FlowNode,
  FlowEdge,
} from "@/entities/workflow/model/workflow.model";

/**
 * Workflow Builder berbasis AI.
 *
 * Mengubah permintaan bahasa alami menjadi definisi workflow `{ nodes, edges }`
 * yang valid memakai Google Gemini. Hasil Gemini divalidasi terhadap katalog
 * `NODE_TYPES` yang ada, lalu diberi posisi otomatis (auto-layout) agar rapi di
 * kanvas editor.
 *
 * Server-only module.
 */

/** Node yang tidak menemukan kredensial cocok dan perlu diisi pengguna. */
export interface MissingCredential {
  nodeLabel: string;
  credentialType: string;
}

export interface BuiltWorkflow {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  missingCredentials: MissingCredential[];
}

/** Peta kind node ke tipe kredensial yang dibutuhkannya. */
const KIND_TO_CREDENTIAL_TYPE = new Map<string, string>(
  NODE_TYPES.filter((nodeType) => nodeType.credentialType).map((nodeType) => [
    nodeType.kind,
    nodeType.credentialType as string,
  ]),
);

/** Bentuk mentah node yang diminta dihasilkan Gemini. */
interface RawBuilderNode {
  ref: string;
  kind: string;
  label?: string;
  config?: Record<string, unknown>;
}

/** Bentuk mentah edge yang diminta dihasilkan Gemini. */
interface RawBuilderEdge {
  from: string;
  to: string;
}

interface RawBuilderResult {
  name?: string;
  nodes?: RawBuilderNode[];
  edges?: RawBuilderEdge[];
}

const VALID_KINDS = new Set<string>(
  NODE_TYPES.map((nodeType) => nodeType.kind),
);

/** Membentuk katalog ringkas node untuk konteks system prompt Gemini. */
function buildNodeCatalog(): string {
  return NODE_TYPES.map((nodeType) => {
    const credentialNote = nodeType.credentialType
      ? ` (butuh kredensial: ${nodeType.credentialType})`
      : "";

    return `- ${nodeType.kind} [${nodeType.category}]${credentialNote}: ${nodeType.description}`;
  }).join("\n");
}

/** System prompt yang membatasi Gemini hanya memakai node yang dikenal. */
function buildSystemPrompt(): string {
  return [
    "Kamu adalah generator workflow otomasi. Ubah permintaan pengguna menjadi JSON workflow yang valid.",
    "",
    "Node yang TERSEDIA (gunakan HANYA kind berikut):",
    buildNodeCatalog(),
    "",
    "ATURAN OUTPUT:",
    "1. Balas HANYA dengan JSON murni tanpa penjelasan, tanpa markdown fence.",
    '2. Struktur: { "name": string, "nodes": [{ "ref": string, "kind": string, "label": string, "config": object }], "edges": [{ "from": ref, "to": ref }] }.',
    '3. `ref` adalah id sementara unik antar node (mis. "n1", "n2") untuk merujuk di edges.',
    "4. Mulai dengan satu node trigger (kind diakhiri _trigger). Untuk otomasi via chat, gunakan whatsapp_trigger atau telegram_trigger.",
    "5. Untuk menyimpan data (mis. catatan keuangan, log), UTAMAKAN Google Sheets (google_sheets_append/read/update). Pakai supabase_insert/supabase_query hanya bila pengguna meminta database. Untuk memproses teks dengan AI pakai ai_gemini.",
    "6. Untuk membalas pesan pakai whatsapp_send atau telegram_send.",
    "7. Isi config secukupnya dan gunakan template {{message}}, {{sender}}, {{name}}, {{text}} bila relevan.",
    "8. credentialId dikosongkan ('') karena dipilih pengguna nanti.",
  ].join("\n");
}

/** Memuat JSON dari teks Gemini, toleran terhadap fence markdown. */
function extractJson(rawText: string): RawBuilderResult {
  const trimmed = rawText.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;

  /** Ambil dari kurung kurawal pertama sampai terakhir sebagai cadangan. */
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");

  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? jsonText.slice(firstBrace, lastBrace + 1)
      : jsonText;

  return JSON.parse(candidate) as RawBuilderResult;
}

/**
 * Memvalidasi hasil mentah dan mengubahnya menjadi FlowNode/FlowEdge dengan id
 * UUID asli + posisi auto-layout. Node dengan kind tak dikenal dibuang beserta
 * edge yang menyentuhnya.
 */
function normalizeBuilderResult(
  raw: RawBuilderResult,
  fallbackName: string,
): BuiltWorkflow {
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];

  const refToId = new Map<string, string>();
  const nodes: FlowNode[] = [];

  let layoutIndex = 0;

  for (const rawNode of rawNodes) {
    if (!rawNode.ref || !VALID_KINDS.has(rawNode.kind)) {
      continue;
    }

    const nodeId = uuidv4();
    refToId.set(rawNode.ref, nodeId);

    nodes.push({
      id: nodeId,
      type: "workflowNode",
      position: { x: 80 + layoutIndex * 280, y: 200 },
      data: {
        kind: rawNode.kind as NodeKind,
        label: rawNode.label ?? rawNode.kind,
        config: rawNode.config ?? {},
        credentialId: "",
      },
    });

    layoutIndex += 1;
  }

  const edges: FlowEdge[] = [];

  for (const rawEdge of rawEdges) {
    const sourceId = refToId.get(rawEdge.from);
    const targetId = refToId.get(rawEdge.to);

    if (!sourceId || !targetId) {
      continue;
    }

    edges.push({
      id: uuidv4(),
      source: sourceId,
      target: targetId,
    });
  }

  return {
    name: raw.name?.trim() || fallbackName,
    nodes,
    edges,
    missingCredentials: [],
  };
}

/**
 * Mengisi `credentialId` tiap node dengan kredensial milik pemilik yang tipenya
 * cocok (ambil terbaru). Node yang tidak menemukan kredensial dikumpulkan agar
 * pengguna bisa diberi tahu apa yang masih perlu diisi.
 */
async function assignCredentials(
  nodes: FlowNode[],
  ownerId: string,
): Promise<MissingCredential[]> {
  const credentialIdByType = new Map<string, string | null>();
  const missing: MissingCredential[] = [];

  for (const node of nodes) {
    const credentialType = KIND_TO_CREDENTIAL_TYPE.get(node.data.kind);

    if (!credentialType) {
      continue;
    }

    if (!credentialIdByType.has(credentialType)) {
      const credentialRecord = await prisma.credential.findFirst({
        where: { userId: ownerId, type: credentialType },
        orderBy: { createdAt: "desc" },
      });

      credentialIdByType.set(credentialType, credentialRecord?.id ?? null);
    }

    const credentialId = credentialIdByType.get(credentialType) ?? null;

    if (credentialId) {
      node.data.credentialId = credentialId;
    } else {
      missing.push({ nodeLabel: node.data.label, credentialType });
    }
  }

  return missing;
}

/**
 * Membangun workflow dari permintaan bahasa alami memakai Gemini.
 *
 * @param prompt permintaan pengguna (mis. "buatkan otomasi pencatat pengeluaran")
 * @param geminiApiKey API key Gemini milik pengguna (dari kredensial)
 */
export async function buildWorkflowFromPrompt(
  prompt: string,
  geminiApiKey: string,
  ownerId: string,
  model: string = GEMINI_MODEL,
): Promise<BuiltWorkflow> {
  const response = await requestExternal(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Builder: Gemini gagal merespons (status ${response.status})`,
    );
  }

  const body = response.body as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    throw new Error("Builder: Gemini tidak menghasilkan output");
  }

  let parsed: RawBuilderResult;

  try {
    parsed = extractJson(rawText);
  } catch {
    throw new Error("Builder: output Gemini bukan JSON yang valid");
  }

  const built = normalizeBuilderResult(parsed, "Otomasi Baru");

  if (built.nodes.length === 0) {
    throw new Error("Builder: tidak ada node valid yang dihasilkan");
  }

  built.missingCredentials = await assignCredentials(built.nodes, ownerId);

  return built;
}
