import { PlusIcon, MousePointer2Icon, CheckCircle2Icon } from "lucide-react";
import { BrandIcon } from "@/shared/ui";

const STEPS = [
  {
    number: "1",
    title: "Buat Workflow",
    description:
      "Mulai dari kanvas kosong dan tambahkan node sesuai kebutuhan.",
  },
  {
    number: "2",
    title: "Konfigurasi Node",
    description:
      "Atur parameter di setiap node dengan interface yang mudah dipahami.",
  },
  {
    number: "3",
    title: "Jalankan & Uji",
    description:
      "Jalankan workflow dan pastikan semuanya berjalan sesuai ekspektasi.",
  },
  {
    number: "4",
    title: "Aktifkan & Otomatiskan",
    description:
      "Aktifkan workflow dan biarkan Fluxera bekerja untuk Anda 24/7.",
  },
];

/** Mini-ilustrasi "Add Node" dengan kursor beranimasi menekan tombol. */
function AddNodeWidget() {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
        <PlusIcon className="size-4" />
        Add Node
      </div>

      <div className="animate-cursor-tap absolute right-6 bottom-3">
        <span className="animate-cursor-ripple absolute -top-1 -left-1 size-7 rounded-full bg-orange-400/40" />
        <MousePointer2Icon className="relative size-5 fill-slate-700 text-slate-700" />
      </div>
    </div>
  );
}

/** Mini-ilustrasi form konfigurasi untuk langkah 2. */
function ConfigWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
        <BrandIcon name="google-sheets" className="size-4" />
        <span className="text-xs font-semibold text-slate-700">
          Google Sheets
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-medium text-slate-400">Credential</p>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">
          My Google Account
        </div>
        <p className="mt-1 text-[10px] font-medium text-slate-400">
          Spreadsheet
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">
          Leads Data
        </div>
      </div>
    </div>
  );
}

/** Mini-ilustrasi "Test Result" untuk langkah 3. */
function TestResultWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-[11px] font-semibold text-slate-500">
        Test Result
      </p>
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-emerald-600">
            <CheckCircle2Icon className="size-3.5" />
            Success
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Duration</span>
          <span className="font-mono font-semibold text-slate-700">2.45s</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Logs</span>
          <span className="text-orange-500">View logs</span>
        </div>
      </div>
    </div>
  );
}

/** Mini-ilustrasi toggle "Workflow Status" untuk langkah 4. */
function StatusToggleWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[11px] font-semibold text-slate-500">
        Workflow Status
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Active</span>
        <span className="flex h-6 w-11 items-center rounded-full bg-orange-500 px-0.5">
          <span className="ml-auto size-5 rounded-full bg-white shadow-sm" />
        </span>
      </div>
    </div>
  );
}

const STEP_WIDGETS = [
  <AddNodeWidget key="1" />,
  <ConfigWidget key="2" />,
  <TestResultWidget key="3" />,
  <StatusToggleWidget key="4" />,
];

/** Bagian "Cara Kerja": empat langkah bernomor dengan konektor & mini-ilustrasi. */
export function LandingHowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="border-y border-slate-100 bg-slate-50/60 py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">
            Cara Kerja
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Automasi dalam 4 langkah mudah
          </h2>
          <p className="mt-3 text-slate-500">
            Dari ide hingga eksekusi hanya dalam hitungan menit.
          </p>
        </div>

        <div className="mt-16 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, stepIndex) => (
            <div key={step.number} className="flex flex-col">
              <div className="relative mb-6 flex items-center">
                <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-md shadow-orange-500/30">
                  {step.number}
                </span>
                {stepIndex < STEPS.length - 1 && (
                  <span className="ml-3 hidden h-px flex-1 border-t border-dashed border-slate-300 lg:block" />
                )}
              </div>

              <h3 className="text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>

              <div className="mt-5">{STEP_WIDGETS[stepIndex]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
