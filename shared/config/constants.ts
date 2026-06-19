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

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  workflows: "/workflows",
  workflow: (id: string) => `/workflows/${id}`,
  credentials: "/credentials",
  executions: "/executions",
  settings: "/settings",
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
  testConnector: "/connectors/test",
  executions: "/executions",
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
