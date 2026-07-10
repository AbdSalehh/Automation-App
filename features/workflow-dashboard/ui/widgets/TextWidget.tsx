"use client";

import type { DashboardRow, DashboardWidget } from "@/entities/dashboard";

interface TextWidgetProps {
  widget: DashboardWidget;
  rows: DashboardRow[];
}

export function TextWidget({ widget, rows }: TextWidgetProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {widget.title}
      </p>
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
        {widget.text || "Tambahkan teks, insight, atau instruksi dashboard."}
      </p>
      <p className="mt-auto pt-4 text-[11px] font-medium text-slate-400">
        {rows.length.toLocaleString("id-ID")} baris tersedia
      </p>
    </div>
  );
}
