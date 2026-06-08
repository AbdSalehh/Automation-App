import { requestExternal } from "@/shared/server/httpClient";

/**
 * Google OAuth helpers shared by Sheets and Calendar connectors.
 *
 * Server-only module.
 */

/**
 * Exchanges a stored refresh token for a short-lived access token.
 * Works for both `google_oauth` and `google_calendar` credentials since they
 * share the same clientId / clientSecret / refreshToken shape.
 */
export async function getGoogleAccessToken(
  credential: Record<string, string>,
): Promise<string> {
  if (
    !credential.clientId ||
    !credential.clientSecret ||
    !credential.refreshToken
  ) {
    throw new Error(
      "Google: kredensial tidak lengkap (clientId, clientSecret, refreshToken)",
    );
  }

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
    throw new Error(
      "Google: gagal menukar refresh token (cek kredensial / token kedaluwarsa)",
    );
  }

  const accessToken = (tokenResponse.body as { access_token?: string })
    ?.access_token;

  if (!accessToken) {
    throw new Error("Google: access token kosong");
  }

  return accessToken;
}
