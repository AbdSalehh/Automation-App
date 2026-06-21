import Link from "next/link";
import { ArrowRightIcon, PlayIcon, CheckCircle2Icon } from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { Button } from "@/shared/ui";
import { LandingFlowCanvas } from "./LandingFlowCanvas";

/** Node & edge untuk kanvas hero, meniru workflow pada gambar referensi. */
const HERO_NODE_SEEDS = [
  {
    id: "cron",
    label: "Cron Trigger",
    description: "Setup jam 09:00",
    category: "trigger" as const,
    icon: "Clock",
    brand: null,
    position: { x: 0, y: 60 },
  },
  {
    id: "sheets",
    label: "Google Sheets",
    description: "Baca data",
    category: "action" as const,
    icon: "Sheet",
    brand: "google-sheets" as const,
    position: { x: 230, y: 60 },
  },
  {
    id: "condition",
    label: "IF Condition",
    description: "Cek kondisi",
    category: "logic" as const,
    icon: "GitBranch",
    brand: null,
    position: { x: 460, y: 0 },
  },
  {
    id: "whatsapp",
    label: "WhatsApp Send",
    description: "Kirim pesan",
    category: "action" as const,
    icon: "MessageCircle",
    brand: "whatsapp" as const,
    position: { x: 460, y: 130 },
  },
  {
    id: "log",
    label: "Log Result",
    description: "Simpan log",
    category: "action" as const,
    icon: "Database",
    brand: null,
    position: { x: 690, y: 60 },
  },
];

const HERO_EDGES = [
  { id: "e1", source: "cron", target: "sheets" },
  { id: "e2", source: "sheets", target: "condition" },
  { id: "e3", source: "sheets", target: "whatsapp" },
  { id: "e4", source: "condition", target: "log" },
  { id: "e5", source: "whatsapp", target: "log" },
];

const HERO_PILLS = [
  { title: "Visual & Intuitif", description: "Drag-and-drop antar node" },
  { title: "Aman & Terenkripsi", description: "Kredensial tersimpan aman" },
  { title: "Scalable & Reliable", description: "Dibangun untuk performa" },
];

/**
 * Bagian hero landing page: judul aksen oranye, deskripsi, pilar singkat,
 * tombol aksi, dan kartu preview editor workflow (mock visual).
 */
export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(249,115,22,0.10),transparent_70%)]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
        <div className="flex flex-col">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-slate-900 md:text-4xl">
            Automasi Workflow Anda,
            <br />
            Visual • Mudah • <span className="text-orange-500">Powerful</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
            {APP_NAME} adalah platform workflow automation berbasis visual node.
            Buat, kelola, dan jalankan otomatisasi bisnis tanpa coding dengan
            drag-and-drop yang intuitif.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {HERO_PILLS.map((pill) => (
              <div key={pill.title} className="flex items-start gap-2">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">
                    {pill.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {pill.description}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href={ROUTES.login} id="hero-login-button">
              <Button
                size="lg"
                className="gap-2 bg-orange-500 px-7 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
              >
                Mulai Gratis
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>

            <a href="#cara-kerja">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-slate-200 bg-white px-7 text-slate-700 hover:bg-slate-50"
              >
                <PlayIcon className="size-4 text-orange-500" />
                Lihat Demo
              </Button>
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Gratis untuk memulai. Tidak perlu kartu kredit.
          </p>
        </div>

        <HeroPreviewCard />
      </div>
    </section>
  );
}

/** Kartu preview hero: kanvas ReactFlow asli beranimasi di dalam mock browser. */
function HeroPreviewCard() {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/30">
      <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-3">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          My Workflow
          <CheckCircle2Icon className="size-3.5 text-emerald-500" />
        </span>
        <span className="ml-auto rounded-md bg-orange-500 px-2 py-1 text-[10px] font-semibold text-white">
          Jalankan
        </span>
      </div>

      <LandingFlowCanvas
        seeds={HERO_NODE_SEEDS}
        edges={HERO_EDGES}
        className="h-[320px] w-full"
      />
    </div>
  );
}
