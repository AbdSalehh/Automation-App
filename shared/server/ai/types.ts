/**
 * Tipe bersama untuk abstraksi penyedia (provider) AI.
 *
 * Agen chat-action tidak lagi terikat ke satu penyedia. Beberapa penyedia
 * disusun sebagai rantai (chain) terurut: penyedia teratas dipakai lebih dulu,
 * dan bila gagal/menghasilkan output kosong, sistem otomatis turun ke penyedia
 * berikutnya.
 *
 * Server-only module.
 */

/** Penyedia AI yang didukung saat ini. */
export type AiProvider =
  | "gemini"
  | "openai"
  | "openrouter"
  | "groq"
  | "mistral";

/** Konfigurasi satu penyedia di dalam rantai fallback. */
export interface AiProviderConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

/** Rantai penyedia terurut. Indeks 0 adalah penyedia utama. */
export type AiChain = AiProviderConfig[];

/** Argumen umum untuk satu permintaan generasi teks. */
export interface GenerateTextArgs {
  chain: AiChain;
  /** Instruksi sistem (persona/aturan) opsional. */
  systemInstruction?: string;
  /** Pesan/prompt utama yang diproses. */
  prompt: string;
  /** Bila true, penyedia diminta membalas JSON murni bila didukung. */
  expectJson?: boolean;
  /** Suhu sampling; default rendah agar keluaran konsisten. */
  temperature?: number;
}
