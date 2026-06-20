import { callProvider } from "./providers";
import type { GenerateTextArgs } from "./types";

/**
 * Orkestrator generasi teks dengan fallback otomatis.
 *
 * Mencoba tiap penyedia dalam `chain` secara berurutan. Bila satu penyedia
 * melempar error atau menghasilkan teks kosong, sistem lanjut ke penyedia
 * berikutnya. Bila seluruh rantai gagal, error terakhir dilempar agar pemanggil
 * bisa memberi tahu pengguna.
 *
 * Server-only module.
 */
export async function generateText({
  chain,
  systemInstruction,
  prompt,
  expectJson = false,
  temperature = 0.2,
}: GenerateTextArgs): Promise<string> {
  if (chain.length === 0) {
    throw new Error("Tidak ada penyedia AI yang dikonfigurasi.");
  }

  let lastError: Error | null = null;

  for (const config of chain) {
    if (!config.apiKey?.trim() || !config.model?.trim()) {
      continue;
    }

    try {
      const text = await callProvider({
        config,
        systemInstruction,
        prompt,
        expectJson,
        temperature,
      });

      if (text.trim()) {
        return text;
      }

      lastError = new Error(`${config.provider} menghasilkan output kosong.`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(
        `[ai] Penyedia ${config.provider} gagal, mencoba fallback:`,
        lastError.message,
      );
    }
  }

  throw new Error(
    `Semua penyedia AI gagal merespons. Penyebab terakhir: ${
      lastError?.message ?? "tidak diketahui"
    }`,
  );
}
