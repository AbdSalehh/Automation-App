import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { CONNECTORS } from "@/shared/server/connectors";

// POST /api/connectors/test — validate connector credentials.
export async function POST(req: Request) {
  return handleRoute(async () => {
    await requireUser();
    const body = (await req.json()) as {
      type?: string;
      data?: Record<string, string>;
    };
    if (!body.type || !CONNECTORS[body.type]) {
      return badRequest("Unknown connector type");
    }
    const result = await CONNECTORS[body.type].test(body.data ?? {});

    // Avoid duplicating the message in both the envelope and the data object.
    // The envelope carries the human-readable message; data carries only the
    // boolean connection status.
    return ok({ connected: result.ok }, result.message);
  });
}
