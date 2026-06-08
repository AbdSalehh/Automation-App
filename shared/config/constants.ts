export const APP_NAME = "AutoFlow";

export const ROUTES = {
  home: "/",
  workflows: "/workflows",
  workflow: (id: string) => `/workflows/${id}`,
  credentials: "/credentials",
  executions: "/executions",
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
  "whatsapp_fonnte",
  "whatsapp_whapi",
  "whatsapp_oauth",
  "telegram",
  "google_oauth",
  "google_service_account",
  "google_calendar",
  "http",
] as const;

export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  whatsapp: "WhatsApp Business API (Meta)",
  whatsapp_fonnte: "WhatsApp via Fonnte (Mudah)",
  whatsapp_whapi: "WhatsApp via Whapi",
  whatsapp_oauth: "WhatsApp OAuth",
  telegram: "Telegram Bot",
  google_oauth: "Google OAuth2",
  google_service_account: "Google Service Account",
  google_calendar: "Google Calendar",
  http: "Generic HTTP",
};
