import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { decryptJson } from "@/shared/lib/crypto";
import { getGoogleAccessToken } from "@/shared/server/google";
import { requestExternal } from "@/shared/server/httpClient";

/**
 * POST /api/connectors/sheets/sheets
 *
 * Returns the list of sheet (tab) names in a spreadsheet so the preview drawer
 * can render a tab bar.
 *
 * Body: { credentialId, spreadsheetId }
 * Returns: { sheets: string[] }
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      credentialId?: string;
      spreadsheetId?: string;
    };

    if (!body.credentialId) {
      return badRequest("credentialId wajib diisi");
    }

    if (!body.spreadsheetId) {
      return badRequest("spreadsheetId wajib diisi");
    }

    const credentialRecord = await prisma.credential.findFirst({
      where: { id: body.credentialId, userId: user.id },
    });

    if (!credentialRecord) {
      return badRequest("Kredensial tidak ditemukan");
    }

    const credential = decryptJson<Record<string, string>>(
      credentialRecord.data,
    );

    const accessToken = await getGoogleAccessToken(credential);

    const response = await requestExternal(
      `https://sheets.googleapis.com/v4/spreadsheets/${body.spreadsheetId}?fields=sheets.properties`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      return badRequest(
        "Gagal membaca daftar sheet — periksa Spreadsheet ID dan akses kredensial",
      );
    }

    const body2 = response.body as {
      sheets?: Array<{ properties?: { title?: string } }>;
    };

    const sheets = (body2.sheets ?? [])
      .map((sheet) => sheet.properties?.title ?? "")
      .filter(Boolean);

    return ok({ sheets }, "Daftar sheet berhasil diambil");
  });
}
