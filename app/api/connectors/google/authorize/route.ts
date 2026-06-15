import { NextResponse } from "next/server";
import { auth } from "@/shared/auth";
import { getRedisClient } from "@/shared/lib/redis";

/**
 * GET /api/connectors/google/authorize
 *
 * Initiates the per-user Google OAuth2 connect flow.
 * Stores clientId/clientSecret in Redis keyed by a state nonce (TTL 10 min),
 * then redirects the browser to Google's consent screen.
 *
 * Query params: clientId, clientSecret, name (credential label)
 */

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
].join(" ");

const STATE_TTL_SECONDS = 600;

const baseUrl = (): string =>
  process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(`${baseUrl()}/login`);
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId")?.trim() ?? "";
  const clientSecret = searchParams.get("clientSecret")?.trim() ?? "";
  const name = searchParams.get("name")?.trim() ?? "";

  if (!clientId || !clientSecret || !name) {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=missing_params`,
    );
  }

  const state = crypto.randomUUID();
  const redirectUri = `${baseUrl()}/api/connectors/google/callback`;

  try {
    const redis = await getRedisClient();

    await redis.setEx(
      `google-oauth-state:${state}`,
      STATE_TTL_SECONDS,
      JSON.stringify({
        clientId,
        clientSecret,
        name,
        userId: session.user.id,
      }),
    );
  } catch {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=state_store_failed`,
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
