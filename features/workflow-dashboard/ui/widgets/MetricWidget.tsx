"use client";

import { TrendingUpIcon } from "lucide-react";
import {
  computeDashboardMetric,
  type DashboardRow,
  type DashboardWidget,
} from "@/entities/dashboard";

interface MetricWidgetProps {
  widget: DashboardWidget;
  rows: DashboardRow[];
}

export function MetricWidget({ widget, rows }: MetricWidgetProps) {
  const value = computeDashboardMetric(rows, widget.binding);
  const suffix = widget.binding.aggregation === "percentage_if" ? "%" : "";

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-orange-100 bg-linear-to-br from-white to-orange-50 p-4 shadow-sm">
      <div>
        <p className="text-xs font-medium text-slate-500">{widget.title}</p>
        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          {value.toLocaleString("id-ID")}
          {suffix}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
        <TrendingUpIcon className="size-4" />
        Data dari {rows.length.toLocaleString("id-ID")} baris
      </div>
    </div>
  );
}
