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
