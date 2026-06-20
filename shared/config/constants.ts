export const APP_NAME = "Fluxera";

/**
 * Model Gemini default untuk seluruh fitur AI (classifier, builder, node).
 * Pusatkan di sini agar tidak ada versi yang tertinggal/usang (mis. 1.5 yang
 * sudah dipensiunkan dan membalas 404).
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Pilihan model Gemini gratis (keluarga Flash/Flash-Lite). Model Pro tidak
 * disertakan karena berbayar. Flash-Lite berguna saat Flash sedang high-traffic
 * karena kuota & bebannya terpisah.
 */
export const GEMINI_MODELS: { value: string; label: string }[] = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (default)" },
  {
    value: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite (ringan, jarang sibuk)",
  },
  { value: "gemini-flash-latest", label: "Gemini Flash (terbaru)" },
  { value: "gemini-flash-lite-latest", label: "Gemini Flash-Lite (terbaru)" },
];

/**
 * Penyedia AI yang didukung agen chat-action. Setiap penyedia punya daftar
 * model populer untuk dropdown UI. OpenAI & OpenRouter memakai Chat Completions,
 * Gemini memakai endpoint nativnya.
 */
export type AiProviderId =
  | "gemini"
  | "openai"
  | "openrouter"
  | "groq"
  | "mistral";

export const AI_PROVIDERS: { value: AiProviderId; label: string }[] = [
  { value: "gemini", label: "Google Gemini (gratis)" },
  { value: "groq", label: "Groq (gratis)" },
  { value: "mistral", label: "Mistral AI (gratis)" },
  { value: "openrouter", label: "OpenRouter (ada model gratis)" },
  { value: "openai", label: "OpenAI (berbayar)" },
];

export const AI_PROVIDER_MODELS: Record<
  AiProviderId,
  { value: string; label: string }[]
> = {
  gemini: GEMINI_MODELS,
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o mini (hemat)" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
  ],
  openrouter: [
    {
      value: "google/gemini-2.0-flash-exp:free",
      label: "Gemini 2.0 Flash (gratis)",
    },
    {
      value: "deepseek/deepseek-r1:free",
      label: "DeepSeek R1 (gratis)",
    },
    {
      value: "meta-llama/llama-3.3-70b-instruct:free",
      label: "Llama 3.3 70B (gratis)",
    },
    {
      value: "meta-llama/llama-3.3-70b-instruct",
      label: "Llama 3.3 70B Instruct",
    },
    {
      value: "deepseek/deepseek-chat",
      label: "DeepSeek Chat",
    },
    {
      value: "anthropic/claude-3.5-sonnet",
      label: "Claude 3.5 Sonnet",
    },
  ],
  groq: [
    {
      value: "llama-3.3-70b-versatile",
      label: "Llama 3.3 70B Versatile (gratis)",
    },
    {
      value: "llama-3.1-8b-instant",
      label: "Llama 3.1 8B Instant (gratis)",
    },
    {
      value: "openai/gpt-oss-120b",
      label: "GPT-OSS 120B (gratis)",
    },
    {
      value: "gemma2-9b-it",
      label: "Gemma2 9B (gratis)",
    },
  ],
  mistral: [
    {
      value: "mistral-small-latest",
      label: "Mistral Small (gratis)",
    },
    {
      value: "open-mistral-nemo",
      label: "Open Mistral Nemo (gratis)",
    },
    {
      value: "mistral-large-latest",
      label: "Mistral Large",
    },
  ],
};

/** Model default per penyedia, dipakai saat pengguna belum memilih. */
export const AI_PROVIDER_DEFAULT_MODEL: Record<AiProviderId, string> = {
  gemini: GEMINI_MODEL,
  openai: "gpt-4o-mini",
  openrouter: "google/gemini-2.0-flash-exp:free",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
};

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  workflows: "/workflows",
  workflow: (id: string) => `/workflows/${id}`,
  credentials: "/credentials",
  executions: "/executions",
  settings: "/settings",
  users: "/users",
  login: "/login",
  onboarding: "/onboarding",
  terms: "/terms",
  privacy: "/privacy",
} as const;

export const API_ROUTES = {
  workflows: "/workflows",
  workflow: (id: string) => `/workflows/${id}`,
  executeWorkflow: (id: string) => `/workflows/${id}/execute`,
  credentials: "/credentials",
  credential: (id: string) => `/credentials/${id}`,
  credentialTest: (id: string) => `/credentials/${id}/test`,
  testConnector: "/connectors/test",
  executions: "/executions",
  metricsDashboard: "/metrics/dashboard",
  metricsWorkflow: (id: string) => `/metrics/workflow/${id}`,
  logs: "/logs",
  generateCase: "/generate-case",
  users: "/users",
  user: (id: string) => `/users/${id}`,
  accountProfile: "/account/profile",
  accountPassword: "/account/password",
} as const;

/** Connector types supported by the platform. Mirrors docs/n8n.md. */
export const CREDENTIAL_TYPES = [
  "whatsapp",
  "whatsapp_oauth",
  "telegram",
  "telegram_personal",
  "gemini",
  "agent_chat",
  "google_oauth",
  "google_service_account",
  "google_calendar",
  "http",
] as const;

export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  whatsapp: "WhatsApp Business API (Meta)",
  whatsapp_oauth: "WhatsApp OAuth",
  telegram: "Telegram Bot (BotFather)",
  telegram_personal: "Telegram Nomor Pribadi",
  gemini: "Google Gemini AI",
  agent_chat: "Agen Chat-Action (Telegram + Gemini)",
  google_oauth: "Google Workspace (OAuth2)",
  google_service_account: "Google Service Account",
  google_calendar: "Google Calendar",
  http: "Generic HTTP",
};
