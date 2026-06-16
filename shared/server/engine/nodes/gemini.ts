import { GEMINI_MODEL } from "@/shared/config/constants";
import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import type { NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems } from "../utils";

/**
 * Node AI Gemini. Mendukung `systemInstruction` (peran/persona AI) dan `prompt`
 * (pesan yang diproses, mendukung template `{{kolom}}`). Output `text` adalah
 * hasil generasi untuk node berikutnya.
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
    throw new Error("Gemini: API key tidak ada");
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
      throw new Error("Gemini: prompt kosong");
    }

    const requestBody: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    /** Persona/peran AI dikirim sebagai system_instruction bila diisi. */
    if (systemInstruction) {
      requestBody.system_instruction = {
        parts: [{ text: resolveTemplate(systemInstruction, item) }],
      };
    }

    const response = await requestExternal(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${credential.apiKey.trim()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: requestBody,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gemini: gagal menghasilkan teks (status ${response.status})`,
      );
    }

    const body = response.body as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    results.push({ ...item, text, raw: body });
  }

  const first = results[0] as { text?: string; raw?: unknown } | undefined;

  return { text: first?.text ?? "", raw: first?.raw, rows: results, results };
};
