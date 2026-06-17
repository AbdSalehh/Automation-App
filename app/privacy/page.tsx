import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";

export const metadata: Metadata = {
  title: `Kebijakan Privasi — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      lastUpdated="17 Juni 2026"
      intro={`Privasi Anda penting bagi kami. Kebijakan ini menjelaskan data apa yang ${APP_NAME} kumpulkan dan bagaimana kami menggunakannya.`}
      sections={[
        {
          heading: "Data yang Kami Kumpulkan",
          body: [
            "Kami mengumpulkan informasi akun (nama, email) saat Anda mendaftar, serta konfigurasi workflow dan log eksekusi yang Anda buat.",
            "Kredensial pihak ketiga (token, API key) yang Anda hubungkan disimpan dalam bentuk terenkripsi.",
          ],
        },
        {
          heading: "Penggunaan Data",
          body: [
            "Data digunakan untuk menjalankan automasi Anda, menampilkan riwayat eksekusi, dan meningkatkan layanan. Kami tidak menjual data pribadi Anda kepada pihak ketiga.",
          ],
        },
        {
          heading: "Penyimpanan & Keamanan",
          body: [
            "Kredensial sensitif tidak pernah dikirim ke sisi klien. Token disimpan terenkripsi di server dan hanya diakses saat eksekusi node yang relevan.",
          ],
        },
        {
          heading: "Layanan Pihak Ketiga",
          body: [
            "Saat Anda menghubungkan akun seperti Google atau Telegram, data yang dipertukarkan tunduk pada kebijakan privasi penyedia tersebut.",
          ],
        },
        {
          heading: "Hak Anda",
          body: [
            "Anda dapat mengakses, memperbarui, atau menghapus data akun Anda kapan saja melalui halaman pengaturan, atau dengan menghubungi kami.",
          ],
        },
      ]}
    />
  );
}
