import Link from "next/link";
import {
  ZapIcon,
  WorkflowIcon,
  BotIcon,
  PlugIcon,
  GaugeIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { Button } from "@/shared/ui";

const FEATURES = [
  {
    icon: WorkflowIcon,
    title: "Editor Visual",
    description:
      "Rangkai automasi dengan node drag-and-drop. Hubungkan trigger, aksi, dan logika tanpa menulis kode.",
  },
  {
    icon: BotIcon,
    title: "Agen AI via Telegram",
    description:
      "Buat, ubah, dan jalankan workflow langsung dari chat. Cukup ketik, agen yang menyusun alurnya.",
  },
  {
    icon: PlugIcon,
    title: "Banyak Integrasi",
    description:
      "WhatsApp, Telegram, Gmail, Google Sheets, Calendar, Drive, hingga database dalam satu kanvas.",
  },
  {
    icon: GaugeIcon,
    title: "Realtime",
    description:
      "Pesan masuk dan eksekusi node tampil seketika berkat koneksi realtime bawaan.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Kredensial Aman",
    description:
      "Token dan API key tersimpan terenkripsi di server, tidak pernah bocor ke sisi klien.",
  },
  {
    icon: ZapIcon,
    title: "Siap Pakai",
    description:
      "Template node siap pakai dan dropdown operasi membuat penyiapan automasi jadi cepat.",
  },
];

/**
 * Landing page publik. Header memuat tombol Login; pengguna yang sudah masuk
 * diarahkan ke daftar workflow oleh server (lihat app/page.tsx).
 */
export function LandingView() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
              <ZapIcon className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#fitur" className="transition-colors hover:text-white">
              Fitur
            </a>
            <Link
              href={ROUTES.terms}
              className="transition-colors hover:text-white"
            >
              Syarat Layanan
            </Link>
            <Link
              href={ROUTES.privacy}
              className="transition-colors hover:text-white"
            >
              Privasi
            </Link>
          </nav>

          <Link href={ROUTES.login} id="header-login-button">
            <Button className="gap-1.5 bg-white text-slate-900 hover:bg-slate-200">
              Login
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.35),transparent_70%)]" />
          <div className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-28 text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Automasi tanpa ribet, didukung AI
            </span>

            <h1 className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl">
              Otomatiskan pekerjaan,
              <br />
              cukup dengan mengobrol.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              {APP_NAME} menyatukan WhatsApp, Telegram, Gmail, dan Google
              Workspace dalam satu kanvas. Bangun automasi lewat editor visual
              atau perintah chat ke agen AI.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link href={ROUTES.login} id="hero-login-button">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-7 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-fuchsia-400"
                >
                  Mulai Sekarang
                  <ArrowRightIcon className="size-4" />
                </Button>
              </Link>

              <a href="#fitur">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent px-7 text-white hover:bg-white/10"
                >
                  Lihat Fitur
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto w-full max-w-6xl px-4 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Semua yang Anda butuhkan
            </h2>
            <p className="mt-3 text-slate-400">
              Dari trigger pesan masuk hingga aksi lintas aplikasi, semuanya
              dalam satu tempat.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.07]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-indigo-300 ring-1 ring-white/10">
                  <feature.icon className="size-5" />
                </span>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-28">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-slate-900 to-fuchsia-600/20 px-8 py-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Siap membangun automasi pertama Anda?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Masuk dan rangkai workflow dalam hitungan menit. Gratis untuk
              memulai.
            </p>

            <Link href={ROUTES.login} className="mt-8 inline-block">
              <Button
                size="lg"
                className="gap-2 bg-white px-8 text-slate-900 hover:bg-slate-200"
              >
                Login &amp; Mulai
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <ZapIcon className="size-4 text-indigo-400" />
            <span>
              &copy; {new Date().getFullYear()} {APP_NAME}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href={ROUTES.terms} className="hover:text-white">
              Syarat Layanan
            </Link>
            <Link href={ROUTES.privacy} className="hover:text-white">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
