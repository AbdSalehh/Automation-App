import { resolveTemplate } from "@/shared/server/templating";
import { generateText } from "@/shared/server/ai/generate";
import type { AiChain, AiProvider } from "@/shared/server/ai/types";
import type { NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems, stripCodeFence } from "../utils";

/**
 * Node AI Agent. Menjalankan satu permintaan AI dengan dukungan beberapa
 * kredensial AI sebagai rantai fallback: bila model utama sedang high-traffic
 * atau gagal, sistem otomatis turun ke kredensial AI berikutnya.
 *
 * Sumber model diambil dari kredensial bertipe `ai` (provider + apiKey + model)
 * yang dipilih pengguna, terurut sesuai prioritas.
 *
 * Config:
 *   - credentialIds: string[] daftar id kredensial AI (urutan = prioritas).
 *   - systemInstruction: persona/aturan opsional (mendukung template).
 *   - prompt: pesan utama (mendukung template `{{kolom}}`).
 */
export const aiAgentHandler: NodeHandler = async ({
  input,
  context,
  config,
}) => {
  const credentialIds = Array.isArray(config.credentialIds)
    ? (config.credentialIds as unknown[]).map((value) => String(value))
    : [];

  if (credentialIds.length === 0) {
    throw new Error("AI Agent: at least one AI credential must be selected");
  }

  /**
   * Susun rantai penyedia dari kredensial AI terpilih, jaga urutan agar
   * fallback mengikuti prioritas yang ditentukan pengguna.
   */
  const chain: AiChain = [];

  for (const credentialId of credentialIds) {
    const credential = await loadCredential(credentialId, context.ownerId);

    if (!credential?.apiKey?.trim() || !credential.model?.trim()) {
      continue;
    }

    chain.push({
      provider: (credential.provider?.trim() || "gemini") as AiProvider,
      apiKey: credential.apiKey.trim(),
      model: credential.model.trim(),
    });
  }

  if (chain.length === 0) {
    throw new Error(
      "AI Agent: the selected AI credential is incomplete (apiKey/model empty)",
    );
  }

  const systemInstruction = String(config.systemInstruction ?? "").trim();

  const items = toItems(input);
  const itemsToProcess = items.length > 0 ? items : [{}];
  const results: unknown[] = [];

  for (const item of itemsToProcess) {
    const prompt = resolveTemplate(String(config.prompt ?? ""), item);

    if (!prompt) {
      throw new Error("AI Agent: empty prompt");
    }

    const rawText = await generateText({
      chain,
      systemInstruction: systemInstruction
        ? resolveTemplate(systemInstruction, item)
        : undefined,
      prompt,
    });

    results.push({ ...item, text: stripCodeFence(rawText) });
  }

  const first = results[0] as { text?: string } | undefined;

  return { text: first?.text ?? "", rows: results, results };
};
