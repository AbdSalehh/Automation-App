export const APP_NAME = "AutoFlow";

export const ROUTES = {
  home: "/",
  workflows: "/workflows",
  workflow: (id: string) => `/workflows/${id}`,
  credentials: "/credentials",
  executions: "/executions",
  settings: "/settings",
  login: "/login",
  onboarding: "/onboarding",
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
} as const;

/** Connector types supported by the platform. Mirrors docs/n8n.md. */
export const CREDENTIAL_TYPES = [
  "whatsapp",
  "whatsapp_oauth",
  "telegram",
  "telegram_personal",
  "gemini",
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
  google_oauth: "Google Workspace (OAuth2)",
  google_service_account: "Google Service Account",
  google_calendar: "Google Calendar",
  http: "Generic HTTP",
};
