import Ably from "ably";

import { handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { whatsappSessionService } from "@/entities/whatsapp-session";

/**
 * Menerbitkan token request Ably yang dibatasi hanya untuk men-subscribe
 * channel session UUID milik user yang sedang login. API key Ably tetap di
 * server.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const ownedSessions = await whatsappSessionService.listSessions(user.id);

    const capability = ownedSessions.reduce<Record<string, ["subscribe"]>>(
      (accumulator, session) => {
        accumulator[`session:${session.sessionId}`] = ["subscribe"];
        return accumulator;
      },
      {},
    );

    capability[`session:${user.id}`] = ["subscribe"];

    const ablyRest = new Ably.Rest({ key: process.env.ABLY_API_KEY });

    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: user.id,
      capability,
    });

    return ok(tokenRequest, "Token Ably berhasil dibuat");
  });
}
