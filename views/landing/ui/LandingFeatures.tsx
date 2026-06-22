import {
  WorkflowIcon,
  KeyRoundIcon,
  PlugIcon,
  CpuIcon,
  HistoryIcon,
  DatabaseIcon,
  type LucideIcon,
} from "lucide-react";
import { LandingFlowCanvas } from "./LandingFlowCanvas";
import {
  CredentialWidget,
  IntegrationsWidget,
  ExecutionStatusWidget,
  RecentExecutionsWidget,
  CacheHitWidget,
} from "./LandingFeatureWidgets";

/** Node & edge mini untuk kartu "Visual Workflow Editor". */
const EDITOR_NODE_SEEDS = [
  {
    id: "trigger",
    label: "Cron",
    description: "Jam 09:00",
    category: "trigger" as const,
    icon: "Clock",
    brand: null,
    position: { x: 0, y: 0 },
  },
  {
    id: "sheet",
    label: "Sheets",
    description: "Baca data",
    category: "action" as const,
    icon: "Sheet",
    brand: "google-sheets" as const,
    position: { x: 180, y: 60 },
  },
  {
    id: "wa",
    label: "WhatsApp",
    description: "Kirim",
    category: "action" as const,
    icon: "MessageCircle",
    brand: "whatsapp" as const,
    position: { x: 360, y: 0 },
  },
];

const EDITOR_EDGES = [
  { id: "fe1", source: "trigger", target: "sheet" },
  { id: "fe2", source: "sheet", target: "wa" },
];

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Widget ilustratif yang dirender di bawah deskripsi kartu. */
  widget: React.ReactNode;
}

const FEATURES: FeatureCard[] = [
  {
    icon: WorkflowIcon,
    title: "Visual Workflow Editor",
    description:
      "Bangun alur kerja dengan mudah menggunakan drag-and-drop node di kanvas interaktif.",
    widget: (
      <LandingFlowCanvas
        seeds={EDITOR_NODE_SEEDS}
        edges={EDITOR_EDGES}
        stepDurationMs={1300}
        className="h-32 w-full"
      />
    ),
  },
  {
    icon: KeyRoundIcon,
    title: "Kredensial Terenkripsi",
    description:
      "Simpan API key & kredensial dengan enkripsi AES-256-GCM di sisi server.",
    widget: <CredentialWidget />,
  },
  {
    icon: PlugIcon,
    title: "Berbagai Integrasi",
    description:
      "Terhubung dengan berbagai layanan populer untuk kebutuhan bisnis Anda.",
    widget: <IntegrationsWidget />,
  },
  {
    icon: CpuIcon,
    title: "Execution Engine In-Process",
    description:
      "Mesin eksekusi cepat untuk memproses workflow secara real-time dan andal.",
    widget: <ExecutionStatusWidget />,
  },
  {
    icon: HistoryIcon,
    title: "Riwayat & Audit Eksekusi",
    description:
      "Pantau setiap eksekusi workflow lengkap dengan detail log, status, dan durasi.",
    widget: <RecentExecutionsWidget />,
  },
  {
    icon: DatabaseIcon,
    title: "Cache dengan Redis",
    description:
      "Optimalkan performa dengan caching cerdas untuk endpoint yang sering diakses.",
    widget: <CacheHitWidget />,
  },
];

/** Grid fitur utama, tiga kolom dengan kartu beraksen oranye + widget ilustratif. */
export function LandingFeatures() {
  return (
    <section id="fitur" className="mx-auto w-full max-w-6xl px-4 pt-10 pb-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">
          Fitur Utama
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Semua yang Anda butuhkan untuk automasi tanpa batas
        </h2>
        <p className="mt-3 text-slate-500">
          Dibangun dengan teknologi modern untuk performa dan keamanan terbaik.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="group border-border/50 fill-mode-backwards bg-card/50 relative inset-2 flex flex-col overflow-hidden rounded-2xl p-6 backdrop-blur transition-all hover:-translate-y-1"
          >
            <div className="from-primary/6 absolute inset-0 bg-linear-to-br to-transparent" />
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-white">
              <feature.icon className="size-5" />
            </span>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              {feature.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {feature.description}
            </p>

            <div className="mt-5">{feature.widget}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
