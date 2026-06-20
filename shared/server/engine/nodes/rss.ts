import { requestExternal } from "@/shared/server/httpClient";
import type { NodeHandler } from "../types";

/**
 * RSS Read — mengambil dan mem-parse item dari sebuah RSS/Atom feed.
 *
 * Parser ringan berbasis regex (tanpa dependensi tambahan) yang mengekstrak
 * judul, link, tanggal, dan ringkasan dari tiap entri. Cukup untuk mayoritas
 * feed berita/blog yang well-formed.
 *
 * Config:
 *   - url: alamat feed.
 *   - limit: jumlah item maksimum (default 20).
 */
export const rssReadHandler: NodeHandler = async ({ config }) => {
  const url = String(config.url ?? "").trim();

  if (!url) {
    throw new Error("RSS: url feed wajib diisi");
  }

  const limit = Math.max(1, Number(config.limit ?? 20));

  const response = await requestExternal(url, {
    method: "GET",
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    responseType: "text",
  });

  if (!response.ok) {
    throw new Error("RSS: gagal mengambil feed");
  }

  const xml = String(response.body ?? "");

  /** Ambil isi tag pertama yang cocok dalam satu blok entri. */
  const extractTag = (block: string, tag: string): string => {
    const match = block.match(
      new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
    );

    if (!match) {
      return "";
    }

    return match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();
  };

  /** Atom feeds memakai <link href="..."/>, RSS memakai <link>...</link>. */
  const extractLink = (block: string): string => {
    const rssLink = extractTag(block, "link");

    if (rssLink) {
      return rssLink;
    }

    const atomLink = block.match(/<link[^>]*href="([^"]+)"/i);

    return atomLink ? atomLink[1].trim() : "";
  };

  const blockMatches =
    xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) ?? [];

  const items = blockMatches.slice(0, limit).map((block) => ({
    title: extractTag(block, "title"),
    link: extractLink(block),
    publishedAt: extractTag(block, "pubDate") || extractTag(block, "updated"),
    summary: extractTag(block, "description") || extractTag(block, "summary"),
  }));

  return { items, count: items.length, rows: items };
};
