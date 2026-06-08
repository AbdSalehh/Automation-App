import type { CredentialType } from "@/shared/config/constants";

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
}

export const CREDENTIAL_FIELDS: Record<CredentialType, CredentialFieldDef[]> = {
  whatsapp: [
    { key: "accessToken", label: "Access Token", secret: true },
    { key: "businessAccountId", label: "Business Account ID" },
    { key: "phoneNumberId", label: "Phone Number ID" },
  ],
  whatsapp_fonnte: [
    {
      key: "apiKey",
      label: "API Key Fonnte",
      secret: true,
      placeholder: "Salin dari dashboard.fonnte.com → Device",
    },
  ],
  whatsapp_whapi: [
    {
      key: "apiToken",
      label: "API Token Whapi",
      secret: true,
      placeholder: "Salin dari panel.whapi.cloud → Channel → Token",
    },
  ],
  whatsapp_oauth: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret", secret: true },
  ],
  telegram: [{ key: "botToken", label: "Bot Token", secret: true }],
  google_oauth: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret", secret: true },
    { key: "refreshToken", label: "Refresh Token", secret: true },
    { key: "scopes", label: "Scopes (comma separated)" },
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
      placeholder: "primary atau email@example.com",
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
