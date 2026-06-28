import crypto from "node:crypto";

/**
 * Enkripsi simetris untuk payload webhook masuk (AES-256-GCM). Kunci diambil
 * dari `WEBHOOK_ENCRYPTION_KEY` dan WAJIB sama persis dengan yang dipakai
 * service Baileys (Express) agar token bisa di-decrypt di sini.
 *
 * Skema ini sengaja dibuat identik dengan `shared/lib/crypto.ts` (format token
 * `base64(iv).base64(tag).base64(ciphertext)`) hanya berbeda sumber kunci,
 * sehingga backend cukup meniru satu helper saja.
 *
 * Modul khusus sisi server — jangan pernah diimpor dari komponen klien.
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.WEBHOOK_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("WEBHOOK_ENCRYPTION_KEY is not set");
  }

  /** Terima hex 64 karakter, atau hash string apa pun ke 32 byte. */
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  return crypto.createHash("sha256").update(raw).digest();
}

/** Mengenkripsi nilai JSON menjadi token ringkas. Dipakai untuk pengujian. */
export function encryptWebhookJson(value: unknown): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

/** Men-decrypt token yang dihasilkan oleh skema {@link encryptWebhookJson}. */
export function decryptWebhookJson<T = unknown>(token: string): T {
  const [ivB64, tagB64, dataB64] = token.split(".");

  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid webhook token");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );

  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as T;
}
