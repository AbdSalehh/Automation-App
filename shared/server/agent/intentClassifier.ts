import { prisma } from "@/shared/lib/prisma";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { decryptJson } from "@/shared/lib/crypto";
import { requestExternal } from "@/shared/server/httpClient";

/**
 * Classifier maksud (intent) untuk router agen WhatsApp.
 *
 * Memanggil Gemini dengan instruksi ketat: hanya menangani topik seputar
 * aplikasi otomasi ini (workflow, node, kredensial, cara pakai). Mengembalikan
 * JSON terstruktur agar router bisa memutuskan tindakan tanpa menebak teks.
 *
 * Server-only module.
 */

export type AgentIntent = "question" | "create" | "run" | "out_of_scope";

export interface IntentResult {
  intent: AgentIntent;
  /** Jawaban langsung untuk intent `question`/`out_of_scope`. */
  answer?: string;
  /** Nama workflow yang dirujuk untuk intent `run`. */
  workflowName?: string;
  /** Ringkasan rencana untuk intent `create` (ditampilkan sebelum konfirmasi). */
  planSummary?: string;
}

/** Ringkasan singkat workflow milik pemilik untuk konteks tanya-jawab. */
export interface WorkflowContext {
  name: string;
  isPublished: boolean;
  nodeCount: number;
  nodeKinds: string[];
}

/** Memuat API key Gemini milik pemilik (kredensial terbaru bertipe gemini). */
export async function loadOwnerGeminiKey(
  ownerId: string,
): Promise<string | null> {
  const geminiCredential = await prisma.credential.findFirst({
    where: { userId: ownerId, type: "gemini" },
    orderBy: { createdAt: "desc" },
  });

  if (!geminiCredential) {
    return null;
  }

  const decrypted = decryptJson<Record<string, string>>(geminiCredential.data);

  return decrypted.apiKey ?? null;
}

/** System prompt yang membatasi Gemini ke domain aplikasi otomasi ini. */
function buildClassifierPrompt(workflows: WorkflowContext[]): string {
  const workflowList =
    workflows.length > 0
      ? workflows
          .map(
            (workflow) =>
              `- "${workflow.name}" (${workflow.isPublished ? "aktif" : "draft"}, ${workflow.nodeCount} node: ${workflow.nodeKinds.join(", ")})`,
          )
          .join("\n")
      : "(belum ada workflow)";

  return [
    "Kamu adalah asisten untuk aplikasi OTOMASI WORKFLOW berbasis WhatsApp.",
    "Tugasmu mengklasifikasi pesan pengguna menjadi salah satu intent dan membalas dalam Bahasa Indonesia.",
    "",
    "BATASAN PENTING: Hanya layani topik seputar aplikasi ini — workflow, otomasi, node, kredensial, dan cara penggunaannya.",
    "Bila pertanyaan di luar topik (mis. cuaca, berita, opini umum), set intent `out_of_scope`.",
    "",
    "Workflow milik pengguna saat ini:",
    workflowList,
    "",
    "INTENT yang tersedia:",
    "1. `question` — pengguna bertanya tentang aplikasi/workflow miliknya. Isi `answer` dengan jawaban berdasarkan daftar workflow di atas.",
    "2. `create` — pengguna ingin MEMBUAT otomasi baru (kata kunci: buat, buatkan, bikin). Isi `planSummary` dengan ringkasan rencana langkah-langkah workflow yang akan dibuat (bahasa awam, 2-4 langkah).",
    "3. `run` — pengguna ingin MENJALANKAN workflow yang sudah ada. Isi `workflowName` dengan nama workflow terdekat dari daftar.",
    "4. `out_of_scope` — di luar topik aplikasi. Isi `answer` dengan penolakan sopan dan arahkan kembali ke fungsi aplikasi.",
    "",
    "ATURAN OUTPUT:",
    "Balas HANYA JSON murni tanpa markdown fence, format:",
    '{ "intent": "...", "answer": "...", "workflowName": "...", "planSummary": "..." }',
    "Sertakan hanya field yang relevan dengan intent terpilih.",
  ].join("\n");
}

/** Memuat JSON dari teks Gemini, toleran terhadap fence markdown. */
function extractJson(rawText: string): IntentResult {
  const trimmed = rawText.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");

  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? jsonText.slice(firstBrace, lastBrace + 1)
      : jsonText;

  return JSON.parse(candidate) as IntentResult;
}

/**
 * Mengklasifikasi pesan pengguna menjadi intent terstruktur memakai Gemini.
 *
 * @param message pesan masuk dari WhatsApp
 * @param workflows ringkasan workflow milik pemilik (konteks tanya-jawab)
 * @param geminiApiKey API key Gemini milik pemilik
 */
export async function classifyIntent(
  message: string,
  workflows: WorkflowContext[],
  geminiApiKey: string,
): Promise<IntentResult> {
  const model = GEMINI_MODEL;

  const response = await requestExternal(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        system_instruction: {
          parts: [{ text: buildClassifierPrompt(workflows) }],
        },
        contents: [{ parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Classifier: Gemini gagal merespons (status ${response.status}): ${JSON.stringify(
        response.body,
      )}`,
    );
  }

  const body = response.body as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!rawText) {
    throw new Error("Classifier: Gemini tidak menghasilkan output");
  }

  return extractJson(rawText);
}
