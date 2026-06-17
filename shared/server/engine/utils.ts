import type { Item } from "./types";

/**
 * Utilitas bersama engine: normalisasi item, kolom spreadsheet, jeda, dan
 * normalisasi nomor telepon. Server-only.
 */

/**
 * Converts a zero-based column index to a spreadsheet column letter.
 * 0 -> A, 25 -> Z, 26 -> AA, etc.
 */
export function indexToColumnLetter(index: number): string {
  let result = "";
  let current = index;

  while (current >= 0) {
    result = String.fromCharCode((current % 26) + 65) + result;
    current = Math.floor(current / 26) - 1;
  }

  return result;
}

/**
 * Membersihkan pembungkus markdown code-fence (mis. ```json ... ``` atau
 * ``` ... ```) yang sering ditambahkan model AI, lalu mengembalikan isi mentah
 * yang sudah dipangkas spasinya.
 */
export function stripCodeFence(value: string): string {
  const trimmed = value.trim();

  const fenceMatch = trimmed.match(/^```[a-zA-Z0-9]*\n?([\s\S]*?)\n?```$/);

  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
}

/**
 * Mengubah nilai sel apa pun menjadi string yang rapi untuk ditulis ke
 * spreadsheet. Objek/array diserialisasi sebagai JSON (bukan "[object Object]"),
 * teks dibersihkan dari code-fence, dan null/undefined menjadi string kosong.
 */
export function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return stripCodeFence(value);
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Coerces an arbitrary node output into an array of items so downstream nodes
 * can iterate uniformly. Recognises common shapes: `{ rows: [...] }`,
 * `{ items: [...] }`, a raw array, or a single object.
 */
export function toItems(value: unknown): Item[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((entry) =>
      entry && typeof entry === "object" ? (entry as Item) : { value: entry },
    );
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.rows)) {
      return record.rows as Item[];
    }

    if (Array.isArray(record.items)) {
      return record.items as Item[];
    }

    return [record];
  }

  return [{ value }];
}

/**
 * Resolves the input into items for an action node, distinguishing a
 * "collection" (explicit rows/items/array from an upstream Read or Filter)
 * from a single ad-hoc payload.
 *
 * - When the upstream produced a collection (even an empty one), we respect it:
 *   an empty collection means "no rows to act on" and the node should no-op
 *   instead of falling back to a manual single send.
 * - When there's no collection context, we return a single empty item so a
 *   manually-configured node (e.g. fixed number + message) can still run once.
 */
export function resolveActionItems(value: unknown): {
  items: Item[];
  isCollection: boolean;
} {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.rows) || Array.isArray(record.items)) {
      return { items: toItems(value), isCollection: true };
    }
  }

  if (Array.isArray(value)) {
    return { items: toItems(value), isCollection: true };
  }

  const items = toItems(value);

  return {
    items: items.length > 0 ? items : [{}],
    isCollection: false,
  };
}

/**
 * Jeda eksekusi selama `ms` milidetik. Dipakai sebagai antrian sederhana agar
 * pengiriman ke banyak nomor tidak terjadi di detik yang sama.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Menghasilkan kunci telepon kanonik agar nomor format lokal dan internasional
 * dianggap sama. Langkah: buang semua non-digit, buang kode negara di depan
 * bila ada, lalu buang `0` di depan.
 *
 * Contoh dengan countryCode "62": "08123456789", "628123456789",
 * dan "+62 812-3456-789" semuanya menjadi "8123456789".
 */
export function normalizePhoneKey(value: string, countryCode = "62"): string {
  let digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const code = countryCode.replace(/\D/g, "");

  /** Buang kode negara di depan (mis. 62) bila masih tersisa digit di belakangnya. */
  if (code && digits.startsWith(code) && digits.length > code.length) {
    digits = digits.slice(code.length);
  }

  /** Buang trunk prefix "0" di depan (format lokal). */
  digits = digits.replace(/^0+/, "");

  return digits;
}

/**
 * Membandingkan dua nomor telepon setelah dinormalisasi ke kunci kanonik.
 * Mengizinkan kecocokan saling-suffix untuk mengakomodasi sisa kode negara
 * yang tak terduga.
 */
export function isSamePhoneKey(
  left: string,
  right: string,
  countryCode = "62",
): boolean {
  const leftKey = normalizePhoneKey(left, countryCode);
  const rightKey = normalizePhoneKey(right, countryCode);

  if (!leftKey || !rightKey) {
    return false;
  }

  return (
    leftKey === rightKey ||
    leftKey.endsWith(rightKey) ||
    rightKey.endsWith(leftKey)
  );
}
