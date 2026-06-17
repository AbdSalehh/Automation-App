import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";

export const metadata: Metadata = {
  title: `Syarat Layanan — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat Layanan"
      lastUpdated="17 Juni 2026"
      intro={`Selamat datang di ${APP_NAME}. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat oleh syarat berikut. Mohon dibaca dengan saksama.`}
      sections={[
        {
          heading: "Penerimaan Syarat",
          body: [
            `Dengan membuat akun atau menggunakan ${APP_NAME}, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen ini.`,
          ],
        },
        {
          heading: "Penggunaan Layanan",
          body: [
            "Anda bertanggung jawab atas seluruh aktivitas yang terjadi pada akun Anda, termasuk automasi yang dibuat dan kredensial pihak ketiga yang dihubungkan.",
            "Anda setuju untuk tidak menyalahgunakan layanan, termasuk mengirim spam, melanggar batas kuota penyedia pihak ketiga, atau melakukan aktivitas ilegal.",
          ],
        },
        {
          heading: "Integrasi Pihak Ketiga",
          body: [
            "Layanan terhubung dengan penyedia seperti WhatsApp, Telegram, dan Google. Penggunaan integrasi tersebut tunduk pada syarat masing-masing penyedia, dan kami tidak bertanggung jawab atas perubahan kebijakan mereka.",
          ],
        },
        {
          heading: "Batasan Tanggung Jawab",
          body: [
            `${APP_NAME} disediakan "sebagaimana adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas kerugian akibat gangguan layanan, kehilangan data, atau kegagalan automasi.`,
          ],
        },
        {
          heading: "Perubahan Syarat",
          body: [
            "Kami dapat memperbarui syarat ini sewaktu-waktu. Perubahan material akan diberitahukan melalui aplikasi. Penggunaan berkelanjutan berarti Anda menerima syarat yang diperbarui.",
          ],
        },
      ]}
    />
  );
}
