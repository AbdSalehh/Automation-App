"use client";

import type { DashboardRow, DashboardWidget } from "@/entities/dashboard";

interface TableWidgetProps {
  widget: DashboardWidget;
  rows: DashboardRow[];
}

export function TableWidget({ widget, rows }: TableWidgetProps) {
  const columns = Object.keys(rows[0] ?? {}).slice(0, 5);
  const visibleRows = rows.slice(0, 6);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-900">{widget.title}</p>
        <p className="text-xs text-slate-500">
          Preview {visibleRows.length} baris
        </p>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100">
                {columns.map((column) => (
                  <td
                    key={column}
                    className="max-w-40 truncate px-3 py-2 text-slate-600"
                  >
                    {row[column] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
