import crypto from "crypto";
import axios from "axios";

/**
 * Axios instance terpusat untuk berkomunikasi dengan WhatsApp API Service
 * (Express + Baileys) yang di-host terpisah (mis. VPS EC2).
 *
 * Hanya boleh dipakai di sisi server (route handler / engine) karena membawa
 * `BAILEYS_API_KEY`. Jangan pernah mengimpor modul ini dari komponen klien.
 */
export const baileysClient = axios.create({
  baseURL: process.env.BAILEYS_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.BAILEYS_API_KEY}`,
  },
});

export function createOwnerHeaders(
  ownerId: string,
  method: string,
  path: string,
): Record<string, string> {
  const ownerSecret = process.env.BAILEYS_OWNER_SECRET;

  if (!ownerSecret) {
    throw new Error("BAILEYS_OWNER_SECRET belum dikonfigurasi");
  }

  const timestamp = Date.now().toString();
  const signedValue = [ownerId, timestamp, method.toUpperCase(), path].join(
    ".",
  );
  const signature = crypto
    .createHmac("sha256", ownerSecret)
    .update(signedValue)
    .digest("hex");

  return {
    "X-Owner-Id": ownerId,
    "X-Owner-Timestamp": timestamp,
    "X-Owner-Signature": signature,
  };
}

baileysClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (axiosError) => {
    if (axios.isAxiosError(axiosError) && axiosError.response?.data) {
      const errorResponseData = axiosError.response.data as {
        message?: string;
      } | null;

      if (errorResponseData && typeof errorResponseData.message === "string") {
        axiosError.message = errorResponseData.message;
      }
    }

    return Promise.reject(axiosError);
  },
);
