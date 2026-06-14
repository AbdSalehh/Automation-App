import Ably from "ably";

import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";

/**
 * Menerbitkan token request Ably yang dibatasi hanya untuk men-subscribe
 * channel milik user yang sedang login. API key Ably tetap di server.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const ablyRest = new Ably.Rest({ key: process.env.ABLY_API_KEY });

    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: user.id,
      capability: {
        [`session:${user.id}`]: ["subscribe"],
      },
    });

    return ok(tokenRequest, "Token Ably berhasil dibuat");
  });
}
