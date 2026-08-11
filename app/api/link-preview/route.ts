import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

import { badRequest, handleRoute, ok } from "@/shared/api/http";
import { requireUser } from "@/shared/auth";
import { externalHttpClient } from "@/shared/server/httpClient";
import type { LinkPreviewMetadata } from "@/entities/link-preview";

const MAXIMUM_RESPONSE_SIZE = 1_000_000;

export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireUser();

    const requestedUrl = new URL(request.url).searchParams.get("url")?.trim();

    if (!requestedUrl) {
      return badRequest("URL wajib diisi");
    }

    const url = parsePublicHttpUrl(requestedUrl);

    if (!url) {
      return badRequest("URL tidak valid atau tidak dapat diakses");
    }

    await assertPublicHostname(url.hostname);

    const response = await externalHttpClient.get<string>(url.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 LinkPreviewBot/1.0",
      },
      maxContentLength: MAXIMUM_RESPONSE_SIZE,
      maxBodyLength: MAXIMUM_RESPONSE_SIZE,
      responseType: "text",
      timeout: 8000,
    });

    if (response.status < 200 || response.status >= 400) {
      throw new Error("Situs tidak dapat menyediakan preview tautan");
    }

    const contentType = String(response.headers["content-type"] ?? "");

    if (!contentType.includes("text/html")) {
      throw new Error("Tautan bukan halaman HTML");
    }

    const finalUrl = parsePublicHttpUrl(
      response.request?.res?.responseUrl ?? url.toString(),
    );

    if (!finalUrl) {
      throw new Error("Redirect menuju URL yang tidak valid");
    }

    await assertPublicHostname(finalUrl.hostname);

    const metadata = parseMetadata(response.data, finalUrl);

    return ok(metadata, "Preview tautan berhasil diambil");
  });
}

export function parsePublicHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");

  if (normalizedHostname === "localhost" || normalizedHostname.endsWith(".local")) {
    throw new Error("Hostname lokal tidak diizinkan");
  }

  const addresses = isIP(normalizedHostname)
    ? [{ address: normalizedHostname }]
    : await lookup(normalizedHostname, { all: true });

  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Alamat jaringan private tidak diizinkan");
  }
}

export function isPrivateAddress(address: string): boolean {
  const normalizedAddress = address.toLowerCase();

  if (normalizedAddress.includes(":")) {
    return (
      normalizedAddress === "::" ||
      normalizedAddress === "::1" ||
      normalizedAddress.startsWith("fc") ||
      normalizedAddress.startsWith("fd") ||
      normalizedAddress.startsWith("fe8") ||
      normalizedAddress.startsWith("fe9") ||
      normalizedAddress.startsWith("fea") ||
      normalizedAddress.startsWith("feb") ||
      normalizedAddress.startsWith("::ffff:127.") ||
      normalizedAddress.startsWith("::ffff:10.") ||
      normalizedAddress.startsWith("::ffff:192.168.")
    );
  }

  const [firstOctet, secondOctet] = normalizedAddress
    .split(".")
    .map((octet) => Number(octet));

  return (
    firstOctet === 0 ||
    firstOctet === 10 ||
    firstOctet === 127 ||
    (firstOctet === 169 && secondOctet === 254) ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168) ||
    firstOctet >= 224
  );
}

export function parseMetadata(html: string, url: URL): LinkPreviewMetadata {
  const getMeta = (...keys: string[]) => {
    for (const key of keys) {
      const escapedKey = escapeRegularExpression(key);
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapedKey}["'][^>]*>`, "i"),
      ];

      for (const pattern of patterns) {
        const value = html.match(pattern)?.[1];

        if (value) {
          return decodeHtmlEntities(value.trim());
        }
      }
    }

    return null;
  };

  const documentTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const title =
    (getMeta("og:title", "twitter:title") ??
      decodeHtmlEntities(documentTitle?.trim() ?? "")) ||
    url.hostname.replace(/^www\./, "");
  const image = getMeta("og:image", "twitter:image");
  const imageUrl = image ? new URL(image, url).toString() : null;

  return {
    url: url.toString(),
    title,
    description: getMeta("og:description", "twitter:description", "description"),
    imageUrl,
    siteName: getMeta("og:site_name") ?? url.hostname.replace(/^www\./, ""),
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
