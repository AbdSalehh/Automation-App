import type { CredentialType } from "@/shared/config/constants";
import { requestExternal } from "@/shared/server/httpClient";

/**
 * Connector layer. Each connector implements a common shape so the engine can
 * call them uniformly. New connectors can be added by extending CONNECTORS.
 *
 * Server-only module.
 */

export interface ConnectorContext {
  /** Decrypted credential fields. */
  credential: Record<string, string>;
  /** Node configuration. */
  config: Record<string, unknown>;
  /** Input data from the previous node. */
  input: unknown;
}

export interface ConnectorTestResult {
  ok: boolean;
  message: string;
}

export interface Connector {
  type: CredentialType;
  test: (credential: Record<string, string>) => Promise<ConnectorTestResult>;
}

export const CONNECTORS: Record<string, Connector> = {
  whatsapp: {
    type: "whatsapp",
    test: async (credential) => {
      if (!credential.accessToken || !credential.phoneNumberId) {
        return {
          ok: false,
          message: "accessToken & phoneNumberId wajib diisi",
        };
      }

      const response = await requestExternal(
        `https://graph.facebook.com/v20.0/${credential.phoneNumberId}`,
        { headers: { Authorization: `Bearer ${credential.accessToken}` } },
      );

      if (!response.ok) {
        return {
          ok: false,
          message: `WhatsApp API menolak (status ${response.status})`,
        };
      }

      return { ok: true, message: "Koneksi WhatsApp berhasil" };
    },
  },

  whatsapp_oauth: {
    type: "whatsapp_oauth",
    test: async (credential) => {
      if (!credential.clientId || !credential.clientSecret) {
        return { ok: false, message: "clientId & clientSecret wajib diisi" };
      }

      return { ok: true, message: "Konfigurasi OAuth lengkap" };
    },
  },

  telegram: {
    type: "telegram",
    test: async (credential) => {
      if (!credential.botToken) {
        return { ok: false, message: "botToken wajib diisi" };
      }

      const response = await requestExternal(
        `https://api.telegram.org/bot${credential.botToken}/getMe`,
        { method: "GET" },
      );

      if (!response.ok) {
        return { ok: false, message: "Token Telegram tidak valid" };
      }

      const botUsername = (response.body as { result?: { username?: string } })
        ?.result?.username;

      return { ok: true, message: `Bot terhubung: @${botUsername ?? "bot"}` };
    },
  },

  telegram_personal: {
    type: "telegram_personal",
    test: async (credential) => {
      if (!credential.apiId || !credential.apiHash || !credential.phoneNumber) {
        return {
          ok: false,
          message: "apiId, apiHash & phoneNumber wajib diisi",
        };
      }

      if (!/^\d+$/.test(credential.apiId.trim())) {
        return { ok: false, message: "apiId harus berupa angka" };
      }

      if (!/^\+?\d{8,15}$/.test(credential.phoneNumber.trim())) {
        return {
          ok: false,
          message: "Format nomor Telegram tidak valid (mis. +628123456789)",
        };
      }

      return {
        ok: true,
        message:
          "Format kredensial valid — login sesi dilakukan saat workflow pertama berjalan",
      };
    },
  },

  gemini: {
    type: "gemini",
    test: async (credential) => {
      if (!credential.apiKey) {
        return { ok: false, message: "apiKey Gemini wajib diisi" };
      }

      const response = await requestExternal(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${credential.apiKey.trim()}`,
        { method: "GET" },
      );

      if (response.status === 400 || response.status === 403) {
        return { ok: false, message: "API key Gemini tidak valid" };
      }

      if (!response.ok) {
        return {
          ok: false,
          message: `Gemini tidak merespons dengan benar (status ${response.status})`,
        };
      }

      return { ok: true, message: "Koneksi Gemini berhasil" };
    },
  },

  google_oauth: {
    type: "google_oauth",
    test: async (credential) => {
      if (!credential.clientId || !credential.clientSecret) {
        return { ok: false, message: "clientId & clientSecret wajib diisi" };
      }

      return { ok: true, message: "Konfigurasi Google OAuth lengkap" };
    },
  },

  google_service_account: {
    type: "google_service_account",
    test: async (credential) => {
      if (!credential.clientEmail || !credential.privateKey) {
        return { ok: false, message: "clientEmail & privateKey wajib diisi" };
      }

      return { ok: true, message: "Service account lengkap" };
    },
  },

  google_calendar: {
    type: "google_calendar",
    test: async (credential) => {
      if (
        !credential.clientId ||
        !credential.clientSecret ||
        !credential.refreshToken
      ) {
        return {
          ok: false,
          message: "clientId, clientSecret & refreshToken wajib diisi",
        };
      }

      // Exchange refresh token for a short-lived access token, then hit the
      // Calendar API's calendarList endpoint to verify scopes are granted.
      const tokenResponse = await requestExternal(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          data: new URLSearchParams({
            client_id: credential.clientId,
            client_secret: credential.clientSecret,
            refresh_token: credential.refreshToken,
            grant_type: "refresh_token",
          }).toString(),
        },
      );

      if (!tokenResponse.ok) {
        return {
          ok: false,
          message: "Refresh token tidak valid atau sudah kedaluwarsa",
        };
      }

      const accessToken = (tokenResponse.body as { access_token?: string })
        ?.access_token;

      if (!accessToken) {
        return { ok: false, message: "Gagal mendapatkan access token" };
      }

      const calendarId = credential.calendarId || "primary";

      const calendarResponse = await requestExternal(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (!calendarResponse.ok) {
        return {
          ok: false,
          message: `Tidak dapat mengakses kalender "${calendarId}" — periksa scope dan calendar ID`,
        };
      }

      const calendarSummary = (calendarResponse.body as { summary?: string })
        ?.summary;

      return {
        ok: true,
        message: `Terhubung ke kalender: ${calendarSummary ?? calendarId}`,
      };
    },
  },

  http: {
    type: "http",
    test: async (credential) => {
      if (!credential.baseURL) {
        return { ok: false, message: "baseURL wajib diisi" };
      }

      return { ok: true, message: "Konfigurasi HTTP lengkap" };
    },
  },
};
