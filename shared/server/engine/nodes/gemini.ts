import { GEMINI_MODEL } from "@/shared/config/constants";
import { resolveTemplate } from "@/shared/server/templating";
import { generateText } from "@/shared/server/ai/generate";
import type { NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems, stripCodeFence } from "../utils";

/**
 * Node AI Gemini. Mendukung `systemInstruction` (peran/persona AI) dan `prompt`
 * (pesan yang diproses, mendukung template `{{kolom}}`). Output `text` adalah
 * hasil generasi untuk node berikutnya. Memanggil lewat abstraksi penyedia AI
 * bersama agar konsisten dengan agen chat-action.
 */
export const aiGeminiHandler: NodeHandler = async ({
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
    throw new Error("Gemini: missing API key");
  }

  const model = String(config.model ?? GEMINI_MODEL);
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
      throw new Error("Gemini: empty prompt");
    }

    const rawText = await generateText({
      chain: [
        {
          provider: "gemini",
          apiKey: credential.apiKey.trim(),
          model,
        },
      ],
      systemInstruction: systemInstruction
        ? resolveTemplate(systemInstruction, item)
        : undefined,
      prompt,
    });

    const text = stripCodeFence(rawText);

    results.push({ ...item, text });
  }

  const first = results[0] as { text?: string } | undefined;

  return { text: first?.text ?? "", rows: results, results };
};
