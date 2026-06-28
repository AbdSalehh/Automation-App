import { AI_PROVIDERS, type CredentialType } from "@/shared/config/constants";

/** Credential as returned to the client — never includes the secret `data`. */
export interface Credential {
  id: string;
  type: CredentialType;
  name: string;
  createdAt: string;
}

export interface CreateCredentialPayload {
  type: CredentialType;
  name: string;
  /** Connector-specific secret fields (token, clientId, etc.). */
  data: Record<string, string>;
}

/** Describes the input fields required for each connector type. */
export interface CredentialFieldDef {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
  /** Bila "select", field dirender sebagai dropdown memakai `options`. */
  type?: "text" | "select";
  /** Pilihan untuk field bertipe select. */
  options?: { value: string; label: string }[];
}

export const CREDENTIAL_FIELDS: Record<CredentialType, CredentialFieldDef[]> = {
  whatsapp: [
    { key: "accessToken", label: "Access Token", secret: true },
    { key: "businessAccountId", label: "Business Account ID" },
    { key: "phoneNumberId", label: "Phone Number ID" },
  ],
  whatsapp_oauth: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret", secret: true },
  ],
  telegram: [{ key: "botToken", label: "Bot Token", secret: true }],
  telegram_personal: [
    {
      key: "apiId",
      label: "API ID",
      placeholder: "From my.telegram.org → API development tools",
    },
    { key: "apiHash", label: "API Hash", secret: true },
    {
      key: "phoneNumber",
      label: "Telegram Number",
      placeholder: "+628123456789",
    },
  ],
  gemini: [
    {
      key: "apiKey",
      label: "Gemini API Key",
      secret: true,
      placeholder: "From aistudio.google.com → Get API key",
    },
  ],
  ai: [
    {
      key: "provider",
      label: "AI Provider",
      type: "select",
      options: AI_PROVIDERS.map((aiProvider) => ({
        value: aiProvider.value,
        label: aiProvider.label,
      })),
    },
    {
      key: "apiKey",
      label: "API Key",
      secret: true,
      placeholder: "API key from the selected provider",
    },
    {
      key: "model",
      label: "Model",
      placeholder: "e.g. gemini-2.5-flash",
    },
  ],
  agent_chat: [
    {
      key: "botToken",
      label: "Telegram Bot Token",
      secret: true,
      placeholder: "From @BotFather → /newbot",
    },
    {
      key: "geminiApiKey",
      label: "Gemini API Key",
      secret: true,
      placeholder: "From aistudio.google.com → Get API key",
    },
    {
      key: "geminiModel",
      label: "Gemini Model",
      placeholder: "gemini-2.5-flash",
    },
  ],
  google_oauth: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret", secret: true },
  ],
  google_service_account: [
    { key: "clientEmail", label: "Client Email" },
    { key: "privateKey", label: "Private Key", secret: true },
  ],
  google_calendar: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret", secret: true },
    { key: "refreshToken", label: "Refresh Token", secret: true },
    {
      key: "calendarId",
      label: "Calendar ID",
      placeholder: "primary or email@example.com",
    },
  ],
  http: [
    {
      key: "baseURL",
      label: "Base URL",
      placeholder: "https://api.example.com",
    },
    { key: "apiKey", label: "API Key", secret: true },
  ],
};
