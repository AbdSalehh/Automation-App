import { NextResponse } from "next/server";
import { auth } from "@/shared/auth";
import { getRedisClient } from "@/shared/lib/redis";
import { encryptJson } from "@/shared/lib/crypto";
import { prisma } from "@/shared/lib/prisma";
import { invalidateKeys, cacheKeys } from "@/shared/lib/cache";

/**
 * GET /api/connectors/google/callback
 *
 * OAuth2 callback: exchanges the authorization code for tokens using the
 * user's own clientId/clientSecret (retrieved from Redis via state nonce),
 * then persists an encrypted `google_oauth` credential for the current user.
 */

const baseUrl = (): string =>
  process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(`${baseUrl()}/login`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=google_auth_denied`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=missing_params`,
    );
  }

  const stateKey = `google-oauth-state:${state}`;

  let clientId: string;
  let clientSecret: string;
  let name: string;

  try {
    const redis = await getRedisClient();
    const stateData = await redis.get(stateKey);

    if (!stateData) {
      return NextResponse.redirect(
        `${baseUrl()}/credentials?error=invalid_state`,
      );
    }

    const parsed = JSON.parse(stateData) as {
      clientId: string;
      clientSecret: string;
      name: string;
      userId: string;
    };

    if (parsed.userId !== session.user.id) {
      return NextResponse.redirect(
        `${baseUrl()}/credentials?error=invalid_state`,
      );
    }

    clientId = parsed.clientId;
    clientSecret = parsed.clientSecret;
    name = parsed.name;

    await redis.del(stateKey);
  } catch {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=state_read_failed`,
    );
  }

  const redirectUri = `${baseUrl()}/api/connectors/google/callback`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=token_exchange_failed`,
    );
  }

  const tokens = (await tokenResponse.json()) as {
    refresh_token?: string;
    error?: string;
  };

  if (!tokens.refresh_token) {
    return NextResponse.redirect(
      `${baseUrl()}/credentials?error=no_refresh_token`,
    );
  }

  await prisma.credential.create({
    data: {
      userId: session.user.id,
      type: "google_oauth",
      name,
      data: encryptJson({
        clientId,
        clientSecret,
        refreshToken: tokens.refresh_token,
      }),
    },
  });

  await invalidateKeys(cacheKeys.credentialList(session.user.id));

  return NextResponse.redirect(
    `${baseUrl()}/credentials?success=google_connected`,
  );
}
