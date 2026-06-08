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

  whatsapp_fonnte: {
    type: "whatsapp_fonnte",
    test: async (credential) => {
      if (!credential.apiKey) {
        return { ok: false, message: "apiKey Fonnte wajib diisi" };
      }

      const apiKey = credential.apiKey.trim();

      const deviceResponse = await requestExternal(
        "https://api.fonnte.com/device",
        {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
          data: {},
        },
      );

      if (deviceResponse.status === 401 || deviceResponse.status === 403) {
        return {
          ok: false,
          message:
            "API key tidak valid — salin ulang token dari dashboard.fonnte.com → Device → Token",
        };
      }

      if (deviceResponse.ok) {
        const body = deviceResponse.body as {
          status?: boolean;
          message?: string;
          data?: Array<{
            name?: string;
            device?: string;
            status?: string;
            quota?: number;
          }>;
        };

        // status: false means auth failed in Fonnte's own envelope
        if (body.status === false) {
          return {
            ok: false,
            message: body.message ?? "API key tidak valid",
          };
        }

        const devices = body.data ?? [];
        const firstDevice = devices[0];
        const deviceName = firstDevice?.name ?? firstDevice?.device ?? "";
        const quota = firstDevice?.quota;

        const resultMessage = [
          "Koneksi Fonnte berhasil",
          deviceName && `device: ${deviceName}`,
          quota !== undefined && `sisa kuota: ${quota}`,
        ]
          .filter(Boolean)
          .join(" — ");

        return { ok: true, message: resultMessage };
      }

      // Fallback: try /send with countOnly=1 (dry-run, zero cost, validates token)
      const dryRunResponse = await requestExternal(
        "https://api.fonnte.com/send",
        {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
          data: {
            target: "628000000000",
            message: "test",
            countOnly: "1",
          },
        },
      );

      if (dryRunResponse.status === 401 || dryRunResponse.status === 403) {
        return {
          ok: false,
          message:
            "API key tidak valid — salin ulang token dari dashboard.fonnte.com → Device → Token",
        };
      }

      if (!dryRunResponse.ok) {
        return {
          ok: false,
          message: `Fonnte tidak merespons dengan benar (status ${dryRunResponse.status}). Pastikan device sudah Connected di Fonnte.`,
        };
      }

      const fallbackBody = dryRunResponse.body as {
        status?: boolean;
        message?: string;
        quota?: Record<string, { quota?: number; remaining?: number }>;
      };

      if (fallbackBody.status === false) {
        return {
          ok: false,
          message: fallbackBody.message ?? "API key tidak valid",
        };
      }

      // Extract quota info from response for a friendlier message
      const quotaEntries = Object.values(fallbackBody.quota ?? {});
      const remaining = quotaEntries[0]?.remaining;

      const resultMessage = [
        "Koneksi Fonnte berhasil",
        remaining !== undefined && `sisa kuota: ${remaining}`,
      ]
        .filter(Boolean)
        .join(" — ");

      return { ok: true, message: resultMessage };
    },
  },

  whatsapp_whapi: {
    type: "whatsapp_whapi",
    test: async (credential) => {
      if (!credential.apiToken) {
        return { ok: false, message: "apiToken Whapi wajib diisi" };
      }

      const apiToken = credential.apiToken.trim();

      const healthResponse = await requestExternal(
        "https://gate.whapi.cloud/health",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (healthResponse.status === 401 || healthResponse.status === 403) {
        return {
          ok: false,
          message:
            "API token tidak valid — salin ulang token dari panel.whapi.cloud → Channel → Token",
        };
      }

      if (!healthResponse.ok) {
        return {
          ok: false,
          message: `Whapi tidak merespons dengan benar (status ${healthResponse.status}). Pastikan channel sudah aktif.`,
        };
      }

      const body = healthResponse.body as {
        status?: { text?: string } | string;
      };

      const channelStatus =
        typeof body.status === "string" ? body.status : body.status?.text;

      const resultMessage = [
        "Koneksi Whapi berhasil",
        channelStatus && `status channel: ${channelStatus}`,
      ]
        .filter(Boolean)
        .join(" — ");

      return { ok: true, message: resultMessage };
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
