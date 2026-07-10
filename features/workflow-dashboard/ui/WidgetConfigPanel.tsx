"use client";

import { Trash2Icon } from "lucide-react";
import type {
  DashboardWidget,
  DashboardWidgetBinding,
} from "@/entities/dashboard";
import {
  Button,
  Input,
  NativeSelect,
  NativeSelectOption,
  Textarea,
} from "@/shared/ui";

interface WidgetConfigPanelProps {
  widget: DashboardWidget | null;
  columns: string[];
  onUpdateWidget: (
    widgetId: string,
    widgetUpdate: Partial<DashboardWidget>,
  ) => void;
  onRemoveWidget: (widgetId: string) => void;
}

function updateBinding(
  widget: DashboardWidget,
  bindingUpdate: Partial<DashboardWidgetBinding>,
): Partial<DashboardWidget> {
  return {
    binding: {
      ...widget.binding,
      ...bindingUpdate,
    },
  };
}

export function WidgetConfigPanel({
  widget,
  columns,
  onUpdateWidget,
  onRemoveWidget,
}: WidgetConfigPanelProps) {
  if (!widget) {
    return (
      <aside className="w-80 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">
          Konfigurasi Widget
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Pilih widget di kanvas untuk mengubah judul, kolom, agregasi, dan
          warna.
        </p>
      </aside>
    );
  }

  const isChartWidget = ["bar", "pie", "line"].includes(widget.type);
  const isMetricWidget = widget.type === "metric";
  const isTextWidget = widget.type === "text";

  return (
    <aside className="w-80 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Konfigurasi Widget
          </p>
          <p className="mt-1 text-xs text-slate-500">Tipe: {widget.type}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="text-rose-500 hover:text-rose-600"
          onClick={() => onRemoveWidget(widget.id)}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500">Judul</label>
        <Input
          value={widget.title}
          onChange={(changeEvent) =>
            onUpdateWidget(widget.id, { title: changeEvent.target.value })
          }
        />
      </div>

      {isTextWidget ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">Isi Teks</label>
          <Textarea
            value={widget.text ?? ""}
            rows={7}
            onChange={(changeEvent) =>
              onUpdateWidget(widget.id, { text: changeEvent.target.value })
            }
          />
        </div>
      ) : null}

      {(isMetricWidget || isChartWidget) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Kolom Utama
          </label>
          <NativeSelect
            className="w-full"
            value={widget.binding.column ?? ""}
            onChange={(changeEvent) =>
              onUpdateWidget(
                widget.id,
                updateBinding(widget, { column: changeEvent.target.value }),
              )
            }
          >
            <NativeSelectOption value="">Pilih kolom</NativeSelectOption>
            {columns.map((column) => (
              <NativeSelectOption key={column} value={column}>
                {column}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}

      {isMetricWidget && (
        <>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Agregasi
            </label>
            <NativeSelect
              className="w-full"
              value={widget.binding.aggregation ?? "count"}
              onChange={(changeEvent) =>
                onUpdateWidget(
                  widget.id,
                  updateBinding(widget, {
                    aggregation: changeEvent.target
                      .value as DashboardWidgetBinding["aggregation"],
                  }),
                )
              }
            >
              <NativeSelectOption value="count">
                Jumlah semua baris
              </NativeSelectOption>
              <NativeSelectOption value="count_if">
                Jumlah sesuai kondisi
              </NativeSelectOption>
              <NativeSelectOption value="percentage_if">
                Persentase sesuai kondisi
              </NativeSelectOption>
              <NativeSelectOption value="sum">Total angka</NativeSelectOption>
              <NativeSelectOption value="average">
                Rata-rata angka
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Operator
            </label>
            <NativeSelect
              className="w-full"
              value={widget.binding.operator ?? "equals"}
              onChange={(changeEvent) =>
                onUpdateWidget(
                  widget.id,
                  updateBinding(widget, {
                    operator: changeEvent.target
                      .value as DashboardWidgetBinding["operator"],
                  }),
                )
              }
            >
              <NativeSelectOption value="equals">
                Sama dengan
              </NativeSelectOption>
              <NativeSelectOption value="not_equals">
                Tidak sama dengan
              </NativeSelectOption>
              <NativeSelectOption value="contains">
                Mengandung
              </NativeSelectOption>
              <NativeSelectOption value="not_empty">
                Tidak kosong
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">
              Nilai Pembanding
            </label>
            <Input
              value={widget.binding.compareValue ?? ""}
              placeholder="Belum Selesai"
              onChange={(changeEvent) =>
                onUpdateWidget(
                  widget.id,
                  updateBinding(widget, {
                    compareValue: changeEvent.target.value,
                  }),
                )
              }
            />
          </div>
        </>
      )}

      {(isMetricWidget || isChartWidget) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">Warna</label>
          <Input
            type="color"
            value={widget.color ?? "#f97316"}
            onChange={(changeEvent) =>
              onUpdateWidget(widget.id, { color: changeEvent.target.value })
            }
          />
        </div>
      )}
    </aside>
  );
}
