import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";
import {
  UserIcon,
  ShieldCheckIcon,
  CreditCardIcon,
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
      intro={`Syarat dan ketentuan penggunaan layanan ${APP_NAME}.`}
      lastUpdated="22 Mei 2025"
      cardTitle="Terms of Service"
      cardDescription={`Syarat dan ketentuan penggunaan layanan ${APP_NAME}.`}
      sections={[
        {
          heading: "Pendahuluan",
          body: [
            `Selamat datang di ${APP_NAME}. Dengan mengakses atau menggunakan layanan kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan ini, harap jangan menggunakan layanan kami.`,
            `${APP_NAME} adalah platform otomasi workflow berbasis cloud yang memungkinkan Anda membuat, menjalankan, dan mengelola alur kerja secara visual.`,
          ],
        },
        {
          heading: "Akun Pengguna",
          body: [
            `Untuk menggunakan layanan ${APP_NAME}, Anda harus membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda dan semua aktivitas yang terjadi di bawah akun Anda.`,
            "Anda setuju untuk segera memberi tahu kami jika terjadi penggunaan yang tidak sah atas akun Anda.",
          ],
        },
        {
          heading: `Layanan ${APP_NAME}`,
          body: [
            `${APP_NAME} menyediakan alat untuk membuat workflow, integrasi, eksekusi otomatis, penyimpanan data, dan fitur lainnya sesuai paket berlangganan Anda.`,
            "Kami berhak untuk mengubah, menangguhkan, atau menghentikan sebagian atau seluruh layanan kapan saja dengan pemberitahuan sebelumnya.",
          ],
        },
        {
          heading: "Penggunaan yang Dilarang",
          body: [
            `Anda setuju untuk tidak menggunakan ${APP_NAME} untuk tujuan ilegal, menipu, merugikan pihak lain, atau melanggar hak pihak ketiga.`,
            "Dilarang menggunakan layanan untuk mengirim spam, malware, atau aktivitas yang dapat mengganggu sistem kami.",
          ],
        },
        {
          heading: "Kepemilikan & Hak Kekayaan Intelektual",
          body: [
            `Semua konten, merek dagang, logo, dan teknologi yang terdapat dalam ${APP_NAME} adalah milik kami atau pemberi lisensi kami dan dilindungi oleh hukum hak cipta dan kekayaan intelektual.`,
            "Anda diberikan lisensi terbatas untuk menggunakan layanan kami sesuai dengan Syarat dan Ketentuan ini.",
          ],
        },
      ]}
      summaryTitle="Ringkasan Ketentuan Utama"
      summarySubtitle="Berikut adalah poin penting yang perlu Anda ketahui."
      summaryCards={[
        {
          icon: <UserIcon className="size-6" />,
          iconClassName: "bg-blue-50 text-blue-600",
          title: "Akun Anda",
          text: "Anda bertanggung jawab atas keamanan akun dan aktivitas yang terjadi.",
        },
        {
          icon: <ShieldCheckIcon className="size-6" />,
          iconClassName: "bg-emerald-50 text-emerald-600",
          title: "Penggunaan Wajar",
          text: "Gunakan layanan secara legal dan tidak melanggar hak pihak lain.",
        },
        {
          icon: <CreditCardIcon className="size-6" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Pembayaran",
          text: "Semua pembayaran bersifat non-refundable kecuali diatur lain.",
        },
        {
          icon: <LockIcon className="size-6" />,
          iconClassName: "bg-purple-50 text-purple-600",
          title: "Keamanan Data",
          text: "Kami menjaga keamanan data Anda sesuai kebijakan privasi.",
        },
        {
          icon: <PencilIcon className="size-6" />,
          iconClassName: "bg-rose-50 text-rose-500",
          title: "Perubahan",
          text: "Kami dapat mengubah ketentuan kapan saja dengan pemberitahuan.",
        },
      ]}
      callToAction={
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded bg-orange-500 text-white">
              <CheckIcon className="size-4" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-slate-700">
              Saya telah membaca, memahami, dan menyetujui Terms of Service{" "}
              {APP_NAME}.
            </span>
          </div>
          <Button className="w-full shrink-0 bg-orange-500 text-white hover:bg-orange-600 sm:w-auto">
            Saya Setuju
          </Button>
        </div>
      }
    />
  );
}
