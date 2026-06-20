import type { AiChain, AiProvider, AiProviderConfig } from "./ai/types";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { loadCredential } from "./engine/credentials";

/**
 * Helper rantai penyedia AI dari konfigurasi `agent_chat`.
 *
 * Mendukung tiga bentuk penyimpanan demi kompatibilitas mundur:
 * 1. Format terbaru: `credentialIds` (referensi ke kredensial AI terurut).
 * 2. Format lama: array `providers` ([{ provider, apiKey, model }]).
 * 3. Format paling lama: `geminiApiKey` + `geminiModel` tunggal.
 *
 * Server-only module.
 */

/** Bentuk konfigurasi agen yang tersimpan terenkripsi di credential `agent_chat`. */
export interface AgentChatConfig {
  botToken?: string;
  /** Format terbaru: daftar id kredensial AI terurut (indeks 0 = utama). */
  credentialIds?: string[];
  /** Format lama: daftar penyedia AI terurut (indeks 0 = utama). */
  providers?: AiProviderConfig[];
  /** Format paling lama: API key Gemini tunggal. */
  geminiApiKey?: string;
  /** Format paling lama: model Gemini tunggal. */
  geminiModel?: string;
}

/**
 * Menyusun rantai dari format lama (providers / geminiApiKey). Tidak menyentuh
 * `credentialIds` karena itu butuh akses DB (lihat `resolveChainFromConfig`).
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

/**
 * Menyusun rantai penyedia dengan menyelesaikan `credentialIds` ke kredensial AI
 * milik pemilik. Bila tidak ada `credentialIds`, jatuh ke format lama lewat
 * `buildChainFromConfig`.
 */
export async function resolveChainFromConfig(
  config: AgentChatConfig,
  ownerId: string,
): Promise<AiChain> {
  if (Array.isArray(config.credentialIds) && config.credentialIds.length > 0) {
    const chain: AiChain = [];

    for (const credentialId of config.credentialIds) {
      const credential = await loadCredential(credentialId, ownerId);

      if (!credential?.apiKey?.trim() || !credential.model?.trim()) {
        continue;
      }

      chain.push({
        provider: (credential.provider?.trim() || "gemini") as AiProvider,
        apiKey: credential.apiKey.trim(),
        model: credential.model.trim(),
      });
    }

    return chain;
  }

  return buildChainFromConfig(config);
}
