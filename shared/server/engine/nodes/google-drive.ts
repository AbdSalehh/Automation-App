import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import { getGoogleAccessToken } from "@/shared/server/google";
import type { Item, NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems } from "../utils";

/** Google Drive upload node — mengunggah file teks ke Drive. */
export const googleDriveUploadHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Drive: missing Google credential");
  }

  const accessToken = await getGoogleAccessToken(credential);

  const item = (toItems(input)[0] ?? {}) as Item;

  const fileName = resolveTemplate(
    String(config.filename ?? config.fileName ?? "untitled.txt"),
    item,
  );
  const fileContent = resolveTemplate(
    String(config.content ?? config.text ?? ""),
    item,
  );
  const folderId = String(config.folderId ?? "").trim();

  const boundary = `automation_${crypto.randomUUID()}`;

  const metadata = {
    name: fileName,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
    `${fileContent}\r\n` +
    `--${boundary}--`;

  const response = await requestExternal(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      data: multipartBody,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Google Drive: gagal mengunggah file (status ${response.status})`,
    );
  }

  const body = response.body as {
    id?: string;
    webViewLink?: string;
  };

  return {
    fileId: body.id ?? null,
    webViewLink: body.webViewLink ?? null,
    raw: body,
  };
};

/** Google Drive list node — daftar file (opsional dalam satu folder). */
export const googleDriveListHandler: NodeHandler = async ({
  node,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Google Drive: missing Google credential");
  }

  const accessToken = await getGoogleAccessToken(credential);

  const folderId = String(config.folderId ?? "").trim();
  const pageSize = Number(config.pageSize ?? 20);

  const query = folderId
    ? `'${folderId}' in parents and trashed=false`
    : "trashed=false";

  const listUrl = new URL("https://www.googleapis.com/drive/v3/files");
  listUrl.searchParams.set("q", query);
  listUrl.searchParams.set("pageSize", String(pageSize));
  listUrl.searchParams.set(
    "fields",
    "files(id,name,mimeType,webViewLink,modifiedTime)",
  );

  const response = await requestExternal(listUrl.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Google Drive: gagal memuat daftar file (status ${response.status})`,
    );
  }

  const body = response.body as {
    files?: Array<Record<string, unknown>>;
  };

  const files = body.files ?? [];

  return { files, rows: files, count: files.length };
};
