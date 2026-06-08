import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { decryptJson } from "@/shared/lib/crypto";
import { getGoogleAccessToken } from "@/shared/server/google";
import { requestExternal } from "@/shared/server/httpClient";

/**
 * POST /api/connectors/sheets/columns
 *
 * Reads the header row plus a sample of data rows so the editor can offer:
 *  - accurate column choices (condition builder, message templates, read/write
 *    column pickers)
 *  - distinct values per column (so condition values can be a dropdown)
 *
 * Body: { credentialId, spreadsheetId, sheetName? }
 * Returns: { headers: string[], valuesByColumn: Record<string, string[]> }
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      credentialId?: string;
      spreadsheetId?: string;
      sheetName?: string;
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

    /**
     * Read the whole sheet (or the named sheet) so every column is captured —
     * not just A:E. The Sheets API returns the used range when given a bare
     * sheet name.
     */
    const sheetName = (body.sheetName ?? "").trim();
    const readRange = sheetName ? sheetName : "Sheet1";

    const response = await requestExternal(
      `https://sheets.googleapis.com/v4/spreadsheets/${body.spreadsheetId}/values/${encodeURIComponent(readRange)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      return badRequest(
        "Gagal membaca sheet — periksa Spreadsheet ID, Nama Sheet, dan akses kredensial",
      );
    }

    const values = (response.body as { values?: string[][] })?.values ?? [];

    const headers = (values[0] ?? [])
      .map((header) => String(header).trim())
      .filter(Boolean);

    /** Collect up to 50 distinct non-empty values per column. */
    const valuesByColumn: Record<string, string[]> = {};

    headers.forEach((header, columnIndex) => {
      const distinct = new Set<string>();

      for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
        const cell = String(values[rowIndex]?.[columnIndex] ?? "").trim();

        if (cell) {
          distinct.add(cell);
        }

        if (distinct.size >= 50) {
          break;
        }
      }

      valuesByColumn[header] = Array.from(distinct);
    });

    return ok({ headers, valuesByColumn }, "Kolom berhasil diambil");
  });
}
