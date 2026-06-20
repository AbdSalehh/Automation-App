import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";
import { generateText } from "@/shared/server/ai/generate";
import type { AiChain } from "@/shared/server/ai/types";

/**
 * Classifier maksud (intent) untuk router agen WhatsApp.
 *
 * Memanggil Gemini dengan instruksi ketat: hanya menangani topik seputar
 * aplikasi otomasi ini (workflow, node, kredensial, cara pakai). Mengembalikan
 * JSON terstruktur agar router bisa memutuskan tindakan tanpa menebak teks.
 *
 * Server-only module.
 */

export type AgentIntent =
  | "question"
  | "create"
  | "run"
  | "list"
  | "explain"
  | "edit"
  | "delete"
  | "publish"
  | "out_of_scope";

export interface IntentResult {
  intent: AgentIntent;
  /** Jawaban langsung untuk intent `question`/`out_of_scope`. */
  answer?: string;
  /** Nama workflow yang dirujuk untuk intent `run`/`explain`/`edit`/`delete`. */
  workflowName?: string;
  /** Nama/label node tertentu yang ingin dijelaskan (intent `explain`). */
  nodeName?: string;
  /** Instruksi perubahan untuk intent `edit` (mis. "tambah node Gmail"). */
  editInstruction?: string;
  /** Status target untuk intent `publish` (true = aktifkan, false = jadikan draft). */
  publishState?: boolean;
  /** Ringkasan rencana untuk intent `create` (ditampilkan sebelum konfirmasi). */
  planSummary?: string;
}

/** Ringkasan singkat workflow milik pemilik untuk konteks tanya-jawab. */
export interface WorkflowContext {
  id: string;
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
    "Kamu adalah asisten untuk aplikasi OTOMASI WORKFLOW dengan antarmuka chat Telegram.",
    "Tugasmu mengklasifikasi pesan pengguna menjadi salah satu intent dan membalas dalam Bahasa Indonesia.",
    "",
    "BATASAN PENTING: Hanya layani topik seputar aplikasi ini — workflow, otomasi, node, kredensial, dan cara penggunaannya.",
    "Bila pertanyaan di luar topik (mis. cuaca, berita, opini umum), set intent `out_of_scope`.",
    "",
    "Workflow milik pengguna saat ini:",
    workflowList,
    "",
    "INTENT yang tersedia:",
    "1. `question` — pengguna bertanya umum tentang aplikasi/workflow miliknya. Isi `answer`.",
    "2. `create` — pengguna ingin MEMBUAT otomasi baru (kata kunci: buat, buatkan, bikin). Isi `planSummary` dengan ringkasan rencana langkah-langkah (bahasa awam, 2-4 langkah).",
    "3. `run` — pengguna ingin MENJALANKAN workflow yang ada. Isi `workflowName` dengan nama terdekat dari daftar.",
    "4. `list` — pengguna minta DAFTAR workflow miliknya (kata kunci: daftar, list, apa saja workflow saya). Tidak perlu field lain.",
    "5. `explain` — pengguna minta PENJELASAN isi workflow atau node tertentu (kata kunci: sebutkan node, jelaskan, node apa saja). Isi `workflowName`. Bila merujuk satu node tertentu, isi juga `nodeName`.",
    "6. `edit` — pengguna ingin MENGUBAH STRUKTUR workflow (kata kunci: ubah, edit, tambah node, ganti node, hapus node). Isi `workflowName` dan `editInstruction`. JANGAN gunakan `edit` untuk sekadar publikasi/aktivasi.",
    "7. `delete` — pengguna ingin MENGHAPUS workflow (kata kunci: hapus, delete). Isi `workflowName`.",
    "8. `publish` — pengguna ingin MENGUBAH STATUS aktif/draft tanpa mengubah node (kata kunci: publish, publikasikan, aktifkan, jadikan aktif, jalankan otomatis, nonaktifkan, jadikan draft, matikan). Isi `workflowName` dan `publishState` (true untuk aktifkan/publish, false untuk draft/nonaktif).",
    "9. `out_of_scope` — di luar topik aplikasi. Isi `answer` dengan penolakan sopan dan arahkan kembali ke fungsi aplikasi.",
    "",
    "GAYA BAHASA untuk `answer`/`planSummary` (akan dikirim ke Telegram):",
    "- Gunakan HTML Telegram bila perlu penekanan: <b>tebal</b>, <i>miring</i>, <u>garis bawah</u>. JANGAN pakai markdown (** atau __).",
    "- Gunakan daftar berpoin dengan karakter • di awal baris bila menyebut beberapa hal.",
    "- Sisipkan 2-3 emoji yang relevan agar ramah, jangan berlebihan.",
    "- Tulis JAWABAN YANG PANJANG, LENGKAP, dan INFORMATIF (minimal 4-6 kalimat). Jangan menjawab terlalu singkat.",
    "- Struktur ideal: (1) kalimat pembuka yang menyapa & merangkum, (2) bagian isi berpoin yang menjelaskan detail/langkah, (3) kalimat penutup berisi saran langkah berikutnya atau ajakan bertanya lebih lanjut.",
    "- Pisahkan setiap paragraf/bagian dengan baris kosong agar mudah dibaca.",
    "",
    "ATURAN OUTPUT:",
    "Balas HANYA JSON murni tanpa markdown fence, format:",
    '{ "intent": "...", "answer": "...", "workflowName": "...", "nodeName": "...", "editInstruction": "...", "publishState": true, "planSummary": "..." }',
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
 * Mengklasifikasi pesan pengguna menjadi intent terstruktur memakai rantai
 * penyedia AI (dengan fallback otomatis bila penyedia utama gagal).
 *
 * @param message pesan masuk dari channel chat
 * @param workflows ringkasan workflow milik pemilik (konteks tanya-jawab)
 * @param chain rantai penyedia AI milik pemilik
 */
export async function classifyIntent(
  message: string,
  workflows: WorkflowContext[],
  chain: AiChain,
): Promise<IntentResult> {
  const rawText = await generateText({
    chain,
    systemInstruction: buildClassifierPrompt(workflows),
    prompt: message,
    expectJson: true,
  });

  if (!rawText) {
    throw new Error("Classifier: penyedia AI tidak menghasilkan output");
  }

  return extractJson(rawText);
}
