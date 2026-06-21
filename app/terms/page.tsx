import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";
import {
  UserIcon,
  ShieldCheckIcon,
  GiftIcon,
  LockIcon,
  PencilIcon,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/shared/ui";

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPage
      type="terms"
      title="Terms of Service"
      intro={`Syarat dan ketentuan penggunaan layanan ${APP_NAME}. ${APP_NAME} adalah layanan gratis.`}
      lastUpdated="20 Juni 2026"
      cardTitle="Terms of Service"
      cardDescription={`Syarat dan ketentuan penggunaan layanan ${APP_NAME}. Mohon baca dengan saksama sebelum menggunakan layanan kami.`}
      sections={[
        {
          heading: "Pendahuluan",
          body: [
            `Selamat datang di ${APP_NAME}. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan ini, harap jangan menggunakan layanan kami.`,
            `${APP_NAME} adalah platform otomasi workflow berbasis cloud yang memungkinkan Anda membuat, menjalankan, dan mengelola alur kerja secara visual.`,
            `${APP_NAME} disediakan secara gratis. Kami tidak memungut biaya apa pun untuk penggunaan layanan ini.`,
          ],
        },
        {
          heading: "Definisi",
          body: [
            `"Layanan" mengacu pada platform ${APP_NAME}, termasuk situs web, antarmuka editor workflow, mesin eksekusi, dan seluruh fitur terkait.`,
            `"Pengguna" adalah individu atau entitas yang membuat akun dan menggunakan Layanan. "Konten Pengguna" adalah seluruh data, konfigurasi workflow, kredensial, dan informasi yang Anda masukkan ke dalam Layanan.`,
          ],
        },
        {
          heading: "Akun Pengguna",
          body: [
            `Untuk menggunakan layanan ${APP_NAME}, Anda harus membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda dan semua aktivitas yang terjadi di bawah akun Anda.`,
            "Anda setuju untuk segera memberi tahu kami jika terjadi penggunaan yang tidak sah atas akun Anda. Akun yang didaftarkan melalui Google mungkin memerlukan persetujuan administrator sebelum dapat digunakan.",
          ],
        },
        {
          heading: `Layanan ${APP_NAME}`,
          body: [
            `${APP_NAME} menyediakan alat untuk membuat workflow, integrasi dengan layanan pihak ketiga, eksekusi otomatis, penyimpanan konfigurasi, dan fitur lainnya tanpa biaya.`,
            "Kami berhak untuk mengubah, menangguhkan, atau menghentikan sebagian atau seluruh layanan kapan saja. Karena layanan ini gratis, kami tidak menjamin ketersediaan tanpa gangguan dan dapat menerapkan batas penggunaan yang wajar untuk menjaga kestabilan sistem.",
          ],
        },
        {
          heading: "Konten Pengguna",
          body: [
            "Anda tetap memiliki seluruh hak atas Konten Pengguna yang Anda masukkan. Anda memberikan kami lisensi terbatas untuk memproses dan menyimpan konten tersebut semata-mata untuk menjalankan Layanan bagi Anda.",
            "Anda bertanggung jawab penuh atas legalitas dan keakuratan Konten Pengguna serta atas tindakan yang dijalankan otomasi Anda terhadap layanan pihak ketiga.",
          ],
        },
        {
          heading: "Integrasi Pihak Ketiga",
          body: [
            `${APP_NAME} dapat terhubung dengan layanan pihak ketiga (mis. Telegram, WhatsApp, Google, dan penyedia AI) menggunakan kredensial yang Anda berikan.`,
            "Penggunaan layanan pihak ketiga tunduk pada syarat dan kebijakan masing-masing penyedia. Kami tidak bertanggung jawab atas perubahan, pembatasan, atau gangguan pada layanan pihak ketiga tersebut.",
          ],
        },
        {
          heading: "Penggunaan yang Dilarang",
          body: [
            `Anda setuju untuk tidak menggunakan ${APP_NAME} untuk tujuan ilegal, menipu, merugikan pihak lain, atau melanggar hak pihak ketiga.`,
            "Dilarang menggunakan layanan untuk mengirim spam, malware, melakukan scraping yang melanggar ketentuan, atau aktivitas yang dapat mengganggu, membebani berlebihan, atau merusak sistem kami maupun pengguna lain.",
          ],
        },
        {
          heading: "Kepemilikan & Hak Kekayaan Intelektual",
          body: [
            `Semua konten, merek dagang, logo, dan teknologi yang terdapat dalam ${APP_NAME} adalah milik kami atau pemberi lisensi kami dan dilindungi oleh hukum hak cipta dan kekayaan intelektual.`,
            "Anda diberikan lisensi terbatas, non-eksklusif, dan dapat dicabut untuk menggunakan layanan kami sesuai dengan Syarat dan Ketentuan ini.",
          ],
        },
        {
          heading: "Batasan Tanggung Jawab",
          body: [
            `Layanan disediakan "sebagaimana adanya" tanpa jaminan dalam bentuk apa pun. Karena ${APP_NAME} gratis, sejauh diizinkan oleh hukum, kami tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.`,
            "Anda menggunakan otomasi yang Anda buat atas risiko Anda sendiri, termasuk dampaknya terhadap data dan akun pihak ketiga yang Anda hubungkan.",
          ],
        },
        {
          heading: "Penghentian",
          body: [
            "Kami dapat menangguhkan atau menghentikan akses Anda jika Anda melanggar Syarat dan Ketentuan ini atau menyalahgunakan layanan.",
            "Anda dapat berhenti menggunakan layanan dan menghapus akun Anda kapan saja melalui halaman pengaturan.",
          ],
        },
        {
          heading: "Perubahan Ketentuan & Hukum yang Berlaku",
          body: [
            "Kami dapat memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Perubahan material akan diberitahukan melalui halaman ini. Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui ketentuan yang diperbarui.",
            "Syarat dan Ketentuan ini diatur oleh hukum yang berlaku di Republik Indonesia.",
          ],
        },
      ]}
      summaryTitle="Ringkasan Ketentuan Utama"
      summarySubtitle="Berikut adalah poin penting yang perlu Anda ketahui."
      summaryCards={[
        {
          icon: <UserIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Akun Anda",
          text: "Anda bertanggung jawab atas keamanan akun dan aktivitas yang terjadi.",
        },
        {
          icon: <ShieldCheckIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Penggunaan Wajar",
          text: "Gunakan layanan secara legal dan tidak melanggar hak pihak lain.",
        },
        {
          icon: <GiftIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Gratis",
          text: "Layanan ini disediakan tanpa biaya apa pun.",
        },
        {
          icon: <LockIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Keamanan Data",
          text: "Kami menjaga keamanan data Anda sesuai kebijakan privasi.",
        },
        {
          icon: <PencilIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-500",
          title: "Perubahan",
          text: "Kami dapat mengubah ketentuan kapan saja dengan pemberitahuan.",
        },
      ]}
      callToAction={null}
    />
  );
}
