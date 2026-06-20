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
      intro="Kami berkomitmen untuk melindungi privasi dan data Anda sesuai dengan kebijakan privasi kami."
      lastUpdated="22 Mei 2025"
      cardTitle="Kebijakan Privasi"
      cardDescription={`Kebijakan ini menjelaskan bagaimana ${APP_NAME} mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan layanan kami.`}
      sections={[
        {
          heading: "Informasi yang Kami Kumpulkan",
          icon: <FolderIcon className="size-5" />,
          iconClassName: "bg-orange-50 text-orange-600",
          body: [
            `Kami mengumpulkan informasi yang Anda berikan secara langsung maupun otomatis saat menggunakan layanan ${APP_NAME}.`,
            "Termasuk di dalamnya adalah informasi akun (nama, email) saat mendaftar, serta konfigurasi workflow dan log eksekusi yang Anda buat.",
          ],
        },
        {
          heading: "Penggunaan Informasi",
          icon: <PieChartIcon className="size-5" />,
          iconClassName: "bg-rose-50 text-rose-500",
          body: [
            "Informasi yang kami kumpulkan digunakan untuk menyediakan, meningkatkan, dan mengamankan layanan kami.",
            "Data digunakan untuk menjalankan automasi Anda secara andal dan memonitor riwayat eksekusi.",
          ],
        },
        {
          heading: "Penyimpanan & Keamanan Data",
          icon: <ShieldIcon className="size-5" />,
          iconClassName: "bg-emerald-50 text-emerald-600",
          body: [
            "Kami menerapkan langkah keamanan teknis dan organisasi untuk melindungi data Anda dari akses tidak sah.",
            "Kredensial pihak ketiga yang Anda hubungkan disimpan dalam bentuk terenkripsi.",
          ],
        },
        {
          heading: "Pembagian Informasi",
          icon: <UsersIcon className="size-5" />,
          iconClassName: "bg-blue-50 text-blue-600",
          body: [
            "Kami tidak menjual data pribadi Anda. Informasi hanya dibagikan dalam kondisi tertentu dan terbatas kepada mitra atau layanan pihak ketiga untuk keperluan eksekusi node.",
          ],
        },
        {
          heading: "Cookies & Teknologi Pelacakan",
          icon: <CookieIcon className="size-5" />,
          iconClassName: "bg-amber-50 text-amber-600",
          body: [
            "Kami menggunakan cookies dan teknologi serupa untuk meningkatkan pengalaman penggunaan Anda saat menggunakan layanan kami.",
          ],
        },
        {
          heading: "Hak Anda",
          icon: <UserCogIcon className="size-5" />,
          iconClassName: "bg-orange-50 text-orange-600",
          body: [
            "Anda memiliki hak untuk mengakses, memperbarui, atau menghapus data pribadi Anda melalui halaman pengaturan.",
          ],
        },
        {
          heading: "Perubahan Kebijakan",
          icon: <PencilIcon className="size-5" />,
          iconClassName: "bg-purple-50 text-purple-600",
          body: [
            "Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan diumumkan di halaman ini.",
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
