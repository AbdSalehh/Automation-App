"use client";

import type { DashboardRow, DashboardWidget } from "@/entities/dashboard";
import { cn } from "@/shared/lib/utils";
import { useWidgetDrag } from "../model/useWidgetDrag";
import { ChartWidget } from "./widgets/ChartWidget";
import { MetricWidget } from "./widgets/MetricWidget";
import { TableWidget } from "./widgets/TableWidget";
import { TextWidget } from "./widgets/TextWidget";

interface DashboardCanvasProps {
  rows: DashboardRow[];
  widgets: DashboardWidget[];
  selectedWidgetId: string | null;
  onSelectWidget: (widgetId: string | null) => void;
  onMoveWidget: (widgetId: string, x: number, y: number) => void;
  onResizeWidget: (widgetId: string, width: number, height: number) => void;
}

function renderWidget(widget: DashboardWidget, rows: DashboardRow[]) {
  if (widget.type === "metric") {
    return <MetricWidget widget={widget} rows={rows} />;
  }

  if (widget.type === "text") {
    return <TextWidget widget={widget} rows={rows} />;
  }

  if (widget.type === "table") {
    return <TableWidget widget={widget} rows={rows} />;
  }

  return <ChartWidget widget={widget} rows={rows} />;
}

function CanvasWidget({
  widget,
  rows,
  isSelected,
  onSelectWidget,
  onMoveWidget,
  onResizeWidget,
}: {
  widget: DashboardWidget;
  rows: DashboardRow[];
  isSelected: boolean;
  onSelectWidget: (widgetId: string | null) => void;
  onMoveWidget: (widgetId: string, x: number, y: number) => void;
  onResizeWidget: (widgetId: string, width: number, height: number) => void;
}) {
  const { isDragging, startDragging } = useWidgetDrag({
    ...widget.layout,
    onMove: (x, y) => onMoveWidget(widget.id, x, y),
    onResize: (width, height) => onResizeWidget(widget.id, width, height),
  });

  return (
    <div
      className={cn(
        "absolute rounded-2xl transition-shadow",
        isSelected && "ring-2 ring-orange-400 ring-offset-2",
        isDragging && "z-20 shadow-2xl",
      )}
      style={{
        left: widget.layout.x,
        top: widget.layout.y,
        width: widget.layout.width,
        height: widget.layout.height,
      }}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onSelectWidget(widget.id);
      }}
    >
      <button
        type="button"
        aria-label="Geser widget"
        className="absolute inset-x-0 top-0 z-10 h-8 cursor-grab rounded-t-2xl active:cursor-grabbing"
        onPointerDown={(pointerEvent) => startDragging(pointerEvent, "move")}
      />

      {renderWidget(widget, rows)}

      <button
        type="button"
        aria-label="Ubah ukuran widget"
        className="absolute right-2 bottom-2 z-10 size-4 cursor-nwse-resize rounded-full border border-white bg-orange-500 shadow-sm"
        onPointerDown={(pointerEvent) => startDragging(pointerEvent, "resize")}
      />
    </div>
  );
}

export function DashboardCanvas({
  rows,
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onMoveWidget,
  onResizeWidget,
}: DashboardCanvasProps) {
  return (
    <div
      className="relative min-h-[760px] flex-1 overflow-auto rounded-3xl border border-slate-200 bg-slate-50 bg-[radial-gradient(circle_at_1px_1px,#cbd5e1_1px,transparent_0)] bg-size-[24px_24px] p-6"
      onClick={() => onSelectWidget(null)}
    >
      {widgets.length === 0 ? (
        <div className="flex h-[520px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 text-center">
          <div>
            <p className="text-lg font-semibold text-slate-700">
              Dashboard masih kosong
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Tambahkan metric, chart, tabel, atau teks dari toolbar.
            </p>
          </div>
        </div>
      ) : (
        widgets.map((widget) => (
          <CanvasWidget
            key={widget.id}
            widget={widget}
            rows={rows}
            isSelected={selectedWidgetId === widget.id}
            onSelectWidget={onSelectWidget}
            onMoveWidget={onMoveWidget}
            onResizeWidget={onResizeWidget}
          />
        ))
      )}
    </div>
  );
}
