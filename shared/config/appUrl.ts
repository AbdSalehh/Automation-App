/**
 * URL publik aplikasi, tanpa garis miring di akhir. Dipakai untuk alamat
 * absolut seperti metadata Open Graph dan header atribusi ke penyedia AI.
 *
 * Urutan sumber mengikuti variabel yang sudah dipakai di route lain (`APP_URL`,
 * lalu `NEXTAUTH_URL`), dengan `NEXT_PUBLIC_APP_URL` sebagai alternatif. Bila
 * semuanya kosong di Vercel, domain produksi dari variabel sistem Vercel
 * dipakai agar tautan pratinjau tidak mengarah ke localhost.
 */
export function getAppUrl(): string {
  const configuredUrl =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelProductionHost) {
    return `https://${vercelProductionHost}`;
  }

  return "http://localhost:3000";
}
