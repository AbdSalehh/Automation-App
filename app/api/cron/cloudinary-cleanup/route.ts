import { baileysClient } from "@/shared/api/baileysClient";
import { handleRoute, ok, unauthorized } from "@/shared/api/http";

const runCleanup = async (request: Request) => {
  return handleRoute(async () => {
    const cronSecret = process.env.CRON_SECRET;
    const url = new URL(request.url);
    const providedSecret =
      url.searchParams.get("secret") ??
      (request.headers.get("authorization") ?? "").replace("Bearer ", "");

    if (!cronSecret || providedSecret !== cronSecret) {
      return unauthorized("Invalid CRON secret");
    }

    const { data: response } = await baileysClient.post(
      "/maintenance/media/cleanup",
    );

    return ok(response.data, "Cleanup media Cloudinary selesai");
  });
};

export const GET = runCleanup;
export const POST = runCleanup;
