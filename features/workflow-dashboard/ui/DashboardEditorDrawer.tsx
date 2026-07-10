"use client";

import {
  BarChart3Icon,
  LineChartIcon,
  PieChartIcon,
  Table2Icon,
  TypeIcon,
  XIcon,
  HashIcon,
} from "lucide-react";
import {
  getDashboardColumns,
  useDashboardStore,
  type DashboardSourceConfig,
  type DashboardWidgetType,
} from "@/entities/dashboard";
import { useWorkflowStore } from "@/entities/workflow";
import { Button, NativeSelect, NativeSelectOption, Spinner } from "@/shared/ui";
import { DashboardCanvas } from "./DashboardCanvas";
import { WidgetConfigPanel } from "./WidgetConfigPanel";

const WIDGET_ACTIONS: Array<{
  type: DashboardWidgetType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "metric", label: "Metric", icon: HashIcon },
  { type: "bar", label: "Bar", icon: BarChart3Icon },
  { type: "pie", label: "Pie", icon: PieChartIcon },
  { type: "line", label: "Line", icon: LineChartIcon },
  { type: "table", label: "Table", icon: Table2Icon },
  { type: "text", label: "Text", icon: TypeIcon },
];

function sourceToValue(source: DashboardSourceConfig): string {
  return [
    source.credentialId,
    source.spreadsheetId,
    source.sheetName ?? "",
  ].join("::");
}

function sourceFromValue(
  value: string,
  sources: DashboardSourceConfig[],
): DashboardSourceConfig | null {
  return sources.find((source) => sourceToValue(source) === value) ?? null;
}

export function DashboardEditorDrawer() {
  const {
    isOpen,
    activeNodeId,
    source,
    rows,
    widgets,
    selectedWidgetId,
    isLoadingRows,
    errorMessage,
    close,
    setSource,
    addWidget,
    updateWidget,
    moveWidget,
    resizeWidget,
    removeWidget,
    selectWidget,
    getConfig,
  } = useDashboardStore();

  const { getSheetSources, updateNodeData } = useWorkflowStore();
  const sheetSources = getSheetSources();
  const columns = getDashboardColumns(rows);
  const selectedWidget =
    widgets.find((widget) => widget.id === selectedWidgetId) ?? null;

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (!activeNodeId) {
      return;
    }

    updateNodeData(activeNodeId, {
      config: getConfig() as unknown as Record<string, unknown>,
    });
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            Dashboard Builder
          </p>
          <p className="text-sm text-slate-500">
            Visualisasikan data dari connector input workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={close}>
            Batal
          </Button>
          <Button type="button" onClick={handleSave}>
            Simpan Dashboard
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={close}>
            <XIcon className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden bg-slate-100 p-4">
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex min-w-80 items-center gap-3">
              <span className="text-sm font-medium text-slate-500">
                Sumber Data
              </span>
              <NativeSelect
                className="w-80"
                value={source ? sourceToValue(source) : ""}
                onChange={(changeEvent) => {
                  const nextSource = sourceFromValue(
                    changeEvent.target.value,
                    sheetSources,
                  );

                  if (nextSource) {
                    setSource(nextSource);
                  }
                }}
              >
                <NativeSelectOption value="">
                  Pilih spreadsheet
                </NativeSelectOption>
                {sheetSources.map((sheetSource) => (
                  <NativeSelectOption
                    key={sourceToValue(sheetSource)}
                    value={sourceToValue(sheetSource)}
                  >
                    {sheetSource.sheetName || "Sheet1"} ·{" "}
                    {sheetSource.spreadsheetId}
                  </NativeSelectOption>
                ))}
              </NativeSelect>

              {isLoadingRows ? <Spinner className="size-4" /> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {WIDGET_ACTIONS.map((widgetAction) => (
                <Button
                  key={widgetAction.type}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => addWidget(widgetAction.type)}
                >
                  <widgetAction.icon className="size-4" />
                  {widgetAction.label}
                </Button>
              ))}
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {errorMessage}
            </div>
          ) : null}

          <DashboardCanvas
            rows={rows}
            widgets={widgets}
            selectedWidgetId={selectedWidgetId}
            onSelectWidget={selectWidget}
            onMoveWidget={moveWidget}
            onResizeWidget={resizeWidget}
          />
        </main>

        <WidgetConfigPanel
          widget={selectedWidget}
          columns={columns}
          onUpdateWidget={updateWidget}
          onRemoveWidget={removeWidget}
        />
      </div>
    </div>
  );
}
