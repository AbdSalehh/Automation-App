import { requestExternal } from "@/shared/server/httpClient";
import type { AiProvider, AiProviderConfig } from "./types";

/**
 * Implementasi pemanggilan tiap penyedia AI.
 *
 * Setiap penyedia menerima instruksi sistem + prompt dan mengembalikan teks
 * mentah. Gemini memakai endpoint native `generativelanguage`, sedangkan OpenAI
 * dan OpenRouter memakai format Chat Completions yang kompatibel. Semua keluar
 * lewat `requestExternal` (Axios terpusat), sesuai aturan kode.
 *
 * Server-only module.
 */

/** Argumen internal untuk satu pemanggilan penyedia. */
interface CompleteArgs {
  config: AiProviderConfig;
  systemInstruction?: string;
  prompt: string;
  expectJson?: boolean;
  temperature: number;
}

/** Memanggil Gemini lewat endpoint native generateContent. */
async function completeGemini({
  config,
  systemInstruction,
  prompt,
  expectJson,
  temperature,
}: CompleteArgs): Promise<string> {
  const requestBody: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(expectJson ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (systemInstruction) {
    requestBody.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await requestExternal(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey.trim()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: requestBody,
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini gagal merespons (status ${response.status})`);
  }

  const body = response.body as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/**
 * Memanggil penyedia berbasis Chat Completions (OpenAI & OpenRouter). Keduanya
 * memakai skema body yang sama, hanya berbeda base URL dan header.
 */
async function completeChatCompletions(
  baseUrl: string,
  { config, systemInstruction, prompt, expectJson, temperature }: CompleteArgs,
  extraHeaders: Record<string, string> = {},
): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  messages.push({ role: "user", content: prompt });

  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature,
    ...(expectJson ? { response_format: { type: "json_object" } } : {}),
  };

  const response = await requestExternal(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey.trim()}`,
      ...extraHeaders,
    },
    data: requestBody,
  });

  if (!response.ok) {
    throw new Error(
      `${config.provider} gagal merespons (status ${response.status})`,
    );
  }

  const body = response.body as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return body.choices?.[0]?.message?.content ?? "";
}

/** Memanggil OpenAI Chat Completions. */
async function completeOpenAi(args: CompleteArgs): Promise<string> {
  return completeChatCompletions("https://api.openai.com/v1", args);
}

/**
 * Memanggil OpenRouter (kompatibel OpenAI). Header `HTTP-Referer` & `X-Title`
 * disertakan sesuai anjuran OpenRouter untuk identifikasi aplikasi.
 */
async function completeOpenRouter(args: CompleteArgs): Promise<string> {
  return completeChatCompletions("https://openrouter.ai/api/v1", args, {
    "HTTP-Referer": "https://fluxera.app",
    "X-Title": "Fluxera",
  });
}

/** Memanggil Groq (kompatibel OpenAI, inferensi cepat & tier gratis). */
async function completeGroq(args: CompleteArgs): Promise<string> {
  return completeChatCompletions("https://api.groq.com/openai/v1", args);
}

/** Memanggil Mistral AI (kompatibel OpenAI, punya tier gratis). */
async function completeMistral(args: CompleteArgs): Promise<string> {
  return completeChatCompletions("https://api.mistral.ai/v1", args);
}

/** Peta penyedia ke fungsi pemanggilnya. */
const PROVIDER_HANDLERS: Record<
  AiProvider,
  (args: CompleteArgs) => Promise<string>
> = {
  gemini: completeGemini,
  openai: completeOpenAi,
  openrouter: completeOpenRouter,
  groq: completeGroq,
  mistral: completeMistral,
};

/**
 * Memanggil satu penyedia dan mengembalikan teks hasilnya. Melempar error bila
 * penyedia tidak dikenal atau gagal merespons.
 */
export async function callProvider(args: CompleteArgs): Promise<string> {
  const handler = PROVIDER_HANDLERS[args.config.provider];

  if (!handler) {
    throw new Error(`Penyedia AI tidak dikenal: ${args.config.provider}`);
  }

  return handler(args);
}
