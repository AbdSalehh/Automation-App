import Image from "next/image";
import { NetworkIcon, ShieldCheckIcon } from "lucide-react";
import { APP_NAME } from "@/shared/config/constants";
import { LoginConsentGate } from "@/features/user-auth";

const FEATURE_CARDS = [
  {
    iconColor: "bg-orange-100 text-orange-600",
    title: "Otomatisasi Cerdas",
    description: "Jalankan tugas berulang tanpa effort manual",
  },
  {
    iconColor: "bg-purple-100 text-purple-600",
    title: "Aman & Terpercaya",
    description: "Keamanan data Anda adalah prioritas kami",
  },
  {
    iconColor: "bg-emerald-100 text-emerald-600",
    title: "Skalabel",
    description: "Dibangun untuk tumbuh bersama bisnis Anda",
  },
] as const;

const FEATURE_ICONS = [
  <svg key="zap" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>,
  <ShieldCheckIcon key="shield" className="size-4" />,
  <svg key="trend" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path d="M3 17l6-6 4 4 8-8v4h-2V9.83l-6 6-4-4L4.41 18z" />
  </svg>,
] as const;

/**
 * Halaman login dengan tata letak dua kolom. Kolom kiri menampilkan banner
 * promosi dengan ilustrasi dan kartu fitur, kolom kanan berisi kartu form login.
 */
export function LoginView() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Kolom kiri: banner promosi */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-orange-50 via-white to-orange-50/40 p-10 lg:flex lg:flex-1 xl:p-14">
        <div className="z-10 flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <NetworkIcon className="size-7 text-orange-500" />
          <span className="text-foreground">{APP_NAME}</span>
        </div>

        <div className="z-10 flex max-w-xl flex-col items-start">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold tracking-wide text-orange-600">
            ✦ Automate. Simplify. Scale.
          </span>

          <h1 className="text-foreground text-4xl leading-[1.15] font-extrabold tracking-tight xl:text-5xl">
            Otomatisasi workflow lebih{" "}
            <span className="text-orange-500">mudah</span> &{" "}
            <span className="text-orange-500">cerdas</span>
          </h1>

          <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
            {APP_NAME} membantu Anda membuat, menjalankan, dan mengelola
            workflow otomatis dengan efisien.
          </p>

          <div className="relative my-8 flex w-full justify-center">
            <Image
              src="/login-illustration.webp"
              alt="Ilustrasi otomatisasi workflow"
              width={520}
              height={400}
              priority
              className="h-auto w-full max-w-lg object-contain"
            />
          </div>
        </div>

        <div className="z-10 grid w-full max-w-xl grid-cols-3 gap-4">
          {FEATURE_CARDS.map((feature, index) => (
            <div
              key={feature.title}
              className="border-border/60 flex flex-col gap-2 rounded-xl border bg-white/80 p-4 shadow-sm backdrop-blur"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${feature.iconColor}`}
              >
                {FEATURE_ICONS[index]}
              </div>
              <div>
                <h4 className="text-foreground text-xs font-bold">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kolom kanan: kartu login */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-6 sm:p-12">
        <div className="flex w-full max-w-md flex-col">
          <div className="border-border bg-card flex w-full flex-col gap-7 rounded-3xl border p-8 shadow-xl sm:p-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground text-3xl font-extrabold tracking-tight">
                Selamat datang kembali! 👋
              </h2>
              <p className="text-muted-foreground text-sm">
                Masuk ke akun {APP_NAME} Anda untuk melanjutkan.
              </p>
            </div>

            <LoginConsentGate />

            <div className="text-muted-foreground border-border flex items-center justify-center gap-2 border-t pt-5">
              <ShieldCheckIcon className="size-4 text-emerald-500" />
              <span className="text-xs">Aman & terenkripsi end-to-end</span>
            </div>
          </div>

          <div className="mt-8 flex w-full justify-center">
            <span className="text-muted-foreground text-center text-xs">
              © 2026 {APP_NAME}. Semua hak dilindungi.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
