import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";
import { baileysClient } from "@/shared/api/baileysClient";
import { requestExternal } from "@/shared/server/httpClient";
import { buildWorkflowFromPrompt } from "@/shared/server/workflowBuilder";

/**
 * Deteksi & penanganan permintaan pembuatan workflow lewat chat (WhatsApp/
 * Telegram). Bila pesan masuk diawali kata kunci builder, sistem memanggil
 * Gemini untuk menyusun workflow, menyimpannya, lalu membalas konfirmasi ke
 * pengirim melalui provider yang sama.
 *
 * Server-only module.
 */

export interface BuilderIntentArgs {
  ownerId: string;
  /** Nomor/chat id pengirim, untuk membalas via provider yang sama. */
  sender: string;
  message: string;
  provider: "whatsapp" | "telegram";
  /** Bot token Telegram (wajib bila provider telegram) untuk membalas. */
  botToken?: string;
}

/** Kata kunci pemicu pembuatan otomasi (case-insensitive, di awal pesan). */
const BUILDER_KEYWORDS = [
  "buatkan otomasi",
  "buat otomasi",
  "buatkan workflow",
  "buat workflow",
  "bikin otomasi",
  "bikinkan otomasi",
];

/** Menentukan apakah sebuah pesan merupakan perintah membangun workflow. */
export function isBuilderCommand(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  return BUILDER_KEYWORDS.some((keyword) => normalized.startsWith(keyword));
}

/** Mengirim balasan teks ke pengirim sesuai provider asal pesan. */
async function replyToSender(
  args: BuilderIntentArgs,
  text: string,
): Promise<void> {
  if (args.provider === "telegram" && args.botToken) {
    await requestExternal(
      `https://api.telegram.org/bot${args.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { chat_id: args.sender, text },
      },
    );

    return;
  }

  if (args.provider === "whatsapp") {
    try {
      await baileysClient.post(`/sessions/${args.ownerId}/send-message`, {
        target: args.sender.replace(/\D/g, ""),
        message: text,
      });
    } catch {
      /** Balasan gagal dikirim tidak boleh menggagalkan pembuatan workflow. */
    }
  }
}

/** Memuat API key Gemini milik pemilik (kredensial pertama bertipe gemini). */
async function loadOwnerGeminiKey(ownerId: string): Promise<string | null> {
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

/**
 * Menangani intent builder. Mengembalikan `true` bila pesan ditangani sebagai
 * perintah pembuatan workflow (sehingga pemanggil tidak meneruskan ke alur
 * workflow biasa), atau `false` bila bukan perintah builder.
 */
export async function handleBuilderIntent(
  args: BuilderIntentArgs,
): Promise<boolean> {
  if (!isBuilderCommand(args.message)) {
    return false;
  }

  const geminiApiKey = await loadOwnerGeminiKey(args.ownerId);

  if (!geminiApiKey) {
    await replyToSender(
      args,
      "Untuk membuat otomasi otomatis, tambahkan dulu kredensial Google Gemini di aplikasi (menu Credentials).",
    );

    return true;
  }

  try {
    const built = await buildWorkflowFromPrompt(args.message, geminiApiKey);

    const created = await prisma.workflow.create({
      data: {
        name: built.name,
        ownerId: args.ownerId,
        nodes: JSON.stringify(built.nodes),
        edges: JSON.stringify(built.edges),
        isPublished: false,
      },
    });

    const nodeSummary = built.nodes
      .map((node) => `• ${node.data.label}`)
      .join("\n");

    await replyToSender(
      args,
      `Otomasi "${built.name}" sudah dibuat dengan ${built.nodes.length} langkah:\n${nodeSummary}\n\nBuka aplikasi untuk meninjau, melengkapi kredensial, dan mempublikasikannya (ID: ${created.id}).`,
    );
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "kesalahan tak dikenal";

    await replyToSender(
      args,
      `Maaf, otomasi gagal dibuat: ${reason}. Coba jelaskan permintaan dengan lebih spesifik.`,
    );
  }

  return true;
}
