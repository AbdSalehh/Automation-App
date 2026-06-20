import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";
import {
  FolderIcon,
  PieChartIcon,
  ShieldIcon,
  UsersIcon,
  CookieIcon,
  UserCogIcon,
  PencilIcon,
  LockIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  DatabaseIcon,
  GlobeIcon,
  HeadphonesIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/shared/ui";

export const metadata: Metadata = {
  title: `Kebijakan Privasi — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      type="privacy"
      title="Kebijakan Privasi"
      intro="Kami berkomitmen melindungi privasi dan data Anda. Layanan ini gratis dan kami tidak pernah menjual data pribadi Anda."
      lastUpdated="20 Juni 2026"
      cardTitle="Kebijakan Privasi"
      cardDescription={`Kebijakan ini menjelaskan bagaimana ${APP_NAME} mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan layanan kami.`}
      sections={[
        {
          heading: "Informasi yang Kami Kumpulkan",
          icon: <FolderIcon className="size-5" />,
          iconClassName: "bg-orange-50 text-orange-600",
          body: [
            `Kami mengumpulkan informasi yang Anda berikan secara langsung maupun otomatis saat menggunakan layanan ${APP_NAME}.`,
            "Termasuk di dalamnya adalah informasi akun (nama, alamat email, dan foto profil dari penyedia login seperti Google) saat mendaftar.",
            "Kami juga menyimpan konfigurasi workflow, kredensial integrasi (terenkripsi), log eksekusi, serta data teknis seperti alamat IP, jenis peramban, dan waktu akses untuk keperluan keamanan dan diagnostik.",
          ],
        },
        {
          heading: "Penggunaan Informasi",
          icon: <PieChartIcon className="size-5" />,
          iconClassName: "bg-rose-50 text-rose-500",
          body: [
            "Informasi yang kami kumpulkan digunakan untuk menyediakan, mengoperasikan, meningkatkan, dan mengamankan layanan kami.",
            "Data digunakan untuk menjalankan otomasi Anda secara andal, menampilkan riwayat eksekusi, mengirim notifikasi terkait layanan, serta mencegah penyalahgunaan.",
            "Kami tidak menggunakan Konten Pengguna Anda untuk tujuan periklanan.",
          ],
        },
        {
          heading: "Penyimpanan & Keamanan Data",
          icon: <ShieldIcon className="size-5" />,
          iconClassName: "bg-emerald-50 text-emerald-600",
          body: [
            "Kami menerapkan langkah keamanan teknis dan organisasi untuk melindungi data Anda dari akses, pengubahan, atau pengungkapan yang tidak sah.",
            "Kredensial pihak ketiga yang Anda hubungkan (mis. token bot, API key) disimpan dalam bentuk terenkripsi dan tidak pernah ditampilkan kembali secara utuh.",
            "Meskipun kami berupaya melindungi data Anda, tidak ada metode transmisi atau penyimpanan elektronik yang sepenuhnya aman.",
          ],
        },
        {
          heading: "Retensi Data",
          icon: <DatabaseIcon className="size-5" />,
          iconClassName: "bg-sky-50 text-sky-600",
          body: [
            "Kami menyimpan data Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan.",
            "Saat Anda menghapus workflow, kredensial, atau akun, data terkait akan dihapus dari sistem aktif kami, kecuali sebagian perlu disimpan untuk memenuhi kewajiban hukum.",
          ],
        },
        {
          heading: "Pembagian Informasi",
          icon: <UsersIcon className="size-5" />,
          iconClassName: "bg-blue-50 text-blue-600",
          body: [
            "Kami tidak menjual data pribadi Anda kepada pihak mana pun.",
            "Informasi hanya dibagikan secara terbatas kepada layanan pihak ketiga yang Anda hubungkan untuk keperluan eksekusi node, atau bila diwajibkan oleh hukum.",
          ],
        },
        {
          heading: "Layanan Pihak Ketiga",
          icon: <ExternalLinkIcon className="size-5" />,
          iconClassName: "bg-indigo-50 text-indigo-600",
          body: [
            `${APP_NAME} berintegrasi dengan layanan pihak ketiga seperti Google, Telegram, WhatsApp, dan penyedia AI. Saat Anda menjalankan otomasi, data yang relevan dikirim ke layanan tersebut sesuai konfigurasi Anda.`,
            "Pemrosesan data oleh penyedia pihak ketiga tunduk pada kebijakan privasi masing-masing. Kami menyarankan Anda meninjau kebijakan mereka.",
          ],
        },
        {
          heading: "Cookies & Teknologi Pelacakan",
          icon: <CookieIcon className="size-5" />,
          iconClassName: "bg-amber-50 text-amber-600",
          body: [
            "Kami menggunakan cookies dan teknologi serupa untuk mengautentikasi sesi Anda, mengingat preferensi, serta meningkatkan pengalaman penggunaan.",
            "Anda dapat mengatur peramban untuk menolak cookies, namun beberapa fitur mungkin tidak berfungsi dengan baik.",
          ],
        },
        {
          heading: "Hak Anda",
          icon: <UserCogIcon className="size-5" />,
          iconClassName: "bg-orange-50 text-orange-600",
          body: [
            "Anda memiliki hak untuk mengakses, memperbarui, mengekspor, atau menghapus data pribadi Anda melalui halaman pengaturan.",
            "Anda juga dapat mencabut akses integrasi pihak ketiga kapan saja dengan menghapus kredensial terkait.",
          ],
        },
        {
          heading: "Privasi Anak",
          icon: <UserCheckIcon className="size-5" />,
          iconClassName: "bg-teal-50 text-teal-600",
          body: [
            `${APP_NAME} tidak ditujukan untuk anak di bawah usia 13 tahun, dan kami tidak dengan sengaja mengumpulkan data pribadi dari anak-anak.`,
          ],
        },
        {
          heading: "Perubahan Kebijakan",
          icon: <PencilIcon className="size-5" />,
          iconClassName: "bg-purple-50 text-purple-600",
          body: [
            "Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan material akan diumumkan di halaman ini beserta tanggal pembaruannya.",
          ],
        },
      ]}
      summaryTitle="Ringkasan Komitmen Kami"
      summarySubtitle="Privasi dan keamanan data Anda adalah prioritas utama kami."
      summaryCards={[
        {
          icon: <LockIcon className="size-6" />,
          iconClassName: "bg-emerald-50 text-emerald-600",
          title: "Lindungi Data Anda",
          text: "Keamanan berlapis untuk melindungi data Anda.",
        },
        {
          icon: <ShieldCheckIcon className="size-6" />,
          iconClassName: "bg-blue-50 text-blue-600",
          title: "Transparan",
          text: "Kami terbuka tentang cara kami menggunakan data.",
        },
        {
          icon: <UserCheckIcon className="size-6" />,
          iconClassName: "bg-purple-50 text-purple-600",
          title: "Kontrol Penuh",
          text: "Anda memiliki kontrol atas data Anda.",
        },
        {
          icon: <DatabaseIcon className="size-6" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Tidak Menjual Data",
          text: "Kami tidak menjual informasi pribadi Anda.",
        },
        {
          icon: <GlobeIcon className="size-6" />,
          iconClassName: "bg-sky-50 text-sky-600",
          title: "Kepatuhan",
          text: "Kami mematuhi standar privasi global.",
        },
      ]}
      callToAction={
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <HeadphonesIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">Pertanyaan tentang Privasi?</h3>
              <p className="text-muted-foreground text-sm">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi kami,
                jangan ragu untuk menghubungi kami.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 border-orange-500 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
          >
            Hubungi Kami
            <ExternalLinkIcon className="size-4" />
          </Button>
        </div>
      }
    />
  );
}
