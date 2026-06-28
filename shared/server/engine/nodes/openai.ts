import { resolveTemplate } from "@/shared/server/templating";
import { generateText } from "@/shared/server/ai/generate";
import type { AiProvider } from "@/shared/server/ai/types";
import type { NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems, stripCodeFence } from "../utils";

/**
 * Node AI OpenAI / OpenRouter. Alternatif Gemini memakai abstraksi penyedia AI
 * bersama. Mendukung `systemInstruction` (persona) dan `prompt` (mendukung
 * template `{{kolom}}`). Output `text` dipakai node berikutnya.
 *
 * Config:
 *   - provider: "openai" (default) atau "openrouter".
 *   - model: nama model (mis. gpt-4o-mini).
 *   - systemInstruction, prompt.
 */
export const aiOpenAiHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential?.apiKey) {
    throw new Error("OpenAI: missing API key");
  }

  const provider = (
    String(config.provider ?? "openai") === "openrouter"
      ? "openrouter"
      : "openai"
  ) as AiProvider;

  const model = String(config.model ?? "gpt-4o-mini").trim();
  const systemInstruction = String(config.systemInstruction ?? "").trim();

  const items = toItems(input);
  const itemsToProcess = items.length > 0 ? items : [{}];
  const results: unknown[] = [];

  for (const item of itemsToProcess) {
    const prompt = resolveTemplate(
      String(config.prompt ?? config.text ?? ""),
      item,
    );

    if (!prompt) {
      throw new Error("OpenAI: empty prompt");
    }

    const rawText = await generateText({
      chain: [{ provider, apiKey: credential.apiKey.trim(), model }],
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
