"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  groupDashboardRows,
  type DashboardRow,
  type DashboardWidget,
} from "@/entities/dashboard";

const CHART_COLORS = [
  "#f97316",
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#e11d48",
  "#0891b2",
];

interface ChartWidgetProps {
  widget: DashboardWidget;
  rows: DashboardRow[];
}

export function ChartWidget({ widget, rows }: ChartWidgetProps) {
  const data = groupDashboardRows(rows, widget.binding).slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
        Pilih kolom untuk menampilkan chart.
      </div>
    );
  }

  if (widget.type === "pie") {
    return (
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">
          {widget.title}
        </p>
        <ResponsiveContainer width="100%" height="82%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius="78%">
              {data.map((datum, datumIndex) => (
                <Cell
                  key={datum.name}
                  fill={CHART_COLORS[datumIndex % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (widget.type === "line") {
    return (
      <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-900">
          {widget.title}
        </p>
        <ResponsiveContainer width="100%" height="82%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={widget.color ?? "#f97316"}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-900">
        {widget.title}
      </p>
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            fill={widget.color ?? "#f97316"}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
