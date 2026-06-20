import type { AiChain, AiProviderConfig } from "./ai/types";
import { GEMINI_MODEL } from "@/shared/config/constants";

/**
 * Helper rantai penyedia AI dari konfigurasi `agent_chat`.
 *
 * Mendukung dua bentuk penyimpanan demi kompatibilitas mundur:
 * 1. Format baru: array `providers` ([{ provider, apiKey, model }]).
 * 2. Format lama: `geminiApiKey` + `geminiModel` tunggal.
 *
 * Server-only module.
 */

/** Bentuk konfigurasi agen yang tersimpan terenkripsi di credential `agent_chat`. */
export interface AgentChatConfig {
  botToken?: string;
  /** Format baru: daftar penyedia AI terurut (indeks 0 = utama). */
  providers?: AiProviderConfig[];
  /** Format lama: API key Gemini tunggal. */
  geminiApiKey?: string;
  /** Format lama: model Gemini tunggal. */
  geminiModel?: string;
}

/**
 * Menyusun rantai penyedia dari konfigurasi agen, menyaring entri yang tidak
 * lengkap. Bila hanya tersedia format lama, dikonversi menjadi satu entri
 * Gemini.
 */
export function buildChainFromConfig(config: AgentChatConfig): AiChain {
  if (Array.isArray(config.providers) && config.providers.length > 0) {
    return config.providers.filter(
      (provider) => provider.apiKey?.trim() && provider.model?.trim(),
    );
  }

  if (config.geminiApiKey?.trim()) {
    return [
      {
        provider: "gemini",
        apiKey: config.geminiApiKey,
        model: config.geminiModel || GEMINI_MODEL,
      },
    ];
  }

  return [];
}
