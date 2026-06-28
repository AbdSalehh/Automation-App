import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { decryptJson } from "@/shared/lib/crypto";
import { getGoogleAccessToken } from "@/shared/server/google";
import { requestExternal } from "@/shared/server/httpClient";

/**
 * POST /api/connectors/sheets/preview
 *
 * Returns the first N rows of a sheet so the editor can render a live
 * spreadsheet-style data preview. Separate from the columns endpoint which
 * returns distinct values per column.
 *
 * Body: { credentialId, spreadsheetId, sheetName?, limit? }
 * Returns: { headers: string[], rows: string[][], totalRows: number }
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      credentialId?: string;
      spreadsheetId?: string;
      sheetName?: string;
      limit?: number;
    };

    if (!body.credentialId) {
      return badRequest("credentialId is required");
    }

    if (!body.spreadsheetId) {
      return badRequest("spreadsheetId is required");
    }

    const credentialRecord = await prisma.credential.findFirst({
      where: { id: body.credentialId, userId: user.id },
    });

    if (!credentialRecord) {
      return badRequest("Credential not found");
    }

    const credential = decryptJson<Record<string, string>>(
      credentialRecord.data,
    );

    const accessToken = await getGoogleAccessToken(credential);

    const sheetName = (body.sheetName ?? "").trim();
    const readRange = sheetName || "Sheet1";
    const rowLimit = Math.min(Number(body.limit ?? 50), 200);

    const response = await requestExternal(
      `https://sheets.googleapis.com/v4/spreadsheets/${body.spreadsheetId}/values/${encodeURIComponent(readRange)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      return badRequest(
        "Gagal membaca sheet — periksa Spreadsheet ID, Nama Sheet, dan akses kredensial",
      );
    }

    const rawValues = (response.body as { values?: string[][] })?.values ?? [];

    const headers = (rawValues[0] ?? [])
      .map((header) => String(header).trim())
      .filter(Boolean);

    const dataRows = rawValues
      .slice(1, rowLimit + 1)
      .map((row) =>
        headers.map((_, columnIndex) => String(row[columnIndex] ?? "").trim()),
      );

    const totalRows = Math.max(0, rawValues.length - 1);

    return ok(
      { headers, rows: dataRows, totalRows },
      "Preview data berhasil diambil",
    );
  });
}
