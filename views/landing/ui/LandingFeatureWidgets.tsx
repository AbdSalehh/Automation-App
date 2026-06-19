import { LockIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { BrandIcon, Sparkline } from "@/shared/ui";

/** Widget mini "Encrypted Credential" untuk kartu Kredensial Terenkripsi. */
export function CredentialWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-[11px] font-semibold text-slate-500">
        Encrypted Credential
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <span className="flex-1 truncate font-mono text-xs tracking-widest text-slate-400">
          ••••••••••••••••••••
        </span>
        <span className="grid size-6 place-items-center rounded-md bg-orange-100 text-orange-600">
          <LockIcon className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

/** Widget mini deret logo integrasi untuk kartu Berbagai Integrasi. */
export function IntegrationsWidget() {
  const brands = ["google-sheets", "whatsapp", "gmail"] as const;

  return (
    <div className="flex items-center gap-3">
      {brands.map((brand) => (
        <span
          key={brand}
          className="grid size-12 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <BrandIcon name={brand} className="size-6" />
        </span>
      ))}
      <span className="grid size-12 place-items-center rounded-xl border border-dashed border-slate-300 text-lg text-slate-300">
        +
      </span>
    </div>
  );
}

/** Widget mini "Execution Status" untuk kartu Execution Engine. */
export function ExecutionStatusWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-500">
          Execution Status
        </p>
        <span className="text-[10px] text-slate-400">Duration</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
          <CheckCircle2Icon className="size-4" />
          Success
        </span>
        <span className="font-mono text-sm font-semibold text-slate-700">
          2.45s
        </span>
      </div>
    </div>
  );
}

/** Widget mini "Recent Executions" untuk kartu Riwayat & Audit. */
export function RecentExecutionsWidget() {
  const rows = [
    { label: "Workflow Marketing", ok: true, time: "2m ago" },
    { label: "Daily Report", ok: false, time: "10m ago" },
    { label: "Data Sync", ok: true, time: "1h ago" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-[11px] font-semibold text-slate-500">
        Recent Executions
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="truncate text-xs text-slate-600">{row.label}</span>
            <span className="flex items-center gap-2">
              <span
                className={
                  row.ok
                    ? "flex items-center gap-1 text-[10px] font-semibold text-emerald-600"
                    : "flex items-center gap-1 text-[10px] font-semibold text-red-500"
                }
              >
                {row.ok ? (
                  <CheckCircle2Icon className="size-3" />
                ) : (
                  <XCircleIcon className="size-3" />
                )}
                {row.ok ? "Success" : "Error"}
              </span>
              <span className="text-[10px] text-slate-400">{row.time}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Widget mini "Cache Hit Rate" dengan line chart untuk kartu Cache Redis. */
export function CacheHitWidget() {
  const cacheTrend = [88, 91, 89, 94, 92, 96, 95, 98];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-500">
          Cache Hit Rate
        </p>
        <span className="text-sm font-bold text-orange-500">98.2%</span>
      </div>
      <div className="mt-3">
        <Sparkline data={cacheTrend} />
      </div>
    </div>
  );
}
