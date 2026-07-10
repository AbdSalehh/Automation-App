import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { dashboardService } from "../service/dashboard.service";
import type {
  DashboardConfig,
  DashboardRow,
  DashboardSourceConfig,
  DashboardWidget,
  DashboardWidgetType,
} from "../model/dashboard.model";

interface DashboardEditorState {
  isOpen: boolean;
  activeNodeId: string | null;
  source: DashboardSourceConfig | null;
  rows: DashboardRow[];
  widgets: DashboardWidget[];
  selectedWidgetId: string | null;
  isLoadingRows: boolean;
  errorMessage: string | null;
  openForNode: (params: {
    nodeId: string;
    config?: DashboardConfig;
    fallbackSource?: DashboardSourceConfig;
  }) => Promise<void>;
  close: () => void;
  setSource: (source: DashboardSourceConfig) => Promise<void>;
  addWidget: (widgetType: DashboardWidgetType) => void;
  updateWidget: (
    widgetId: string,
    widgetUpdate: Partial<DashboardWidget>,
  ) => void;
  moveWidget: (widgetId: string, x: number, y: number) => void;
  resizeWidget: (widgetId: string, width: number, height: number) => void;
  removeWidget: (widgetId: string) => void;
  selectWidget: (widgetId: string | null) => void;
  getConfig: () => DashboardConfig;
}

function createDefaultWidget(widgetType: DashboardWidgetType): DashboardWidget {
  const widgetTitles: Record<DashboardWidgetType, string> = {
    metric: "Kartu Metrik",
    bar: "Bar Chart",
    pie: "Pie Chart",
    line: "Line Chart",
    table: "Tabel Data",
    text: "Teks",
  };

  return {
    id: uuidv4(),
    type: widgetType,
    title: widgetTitles[widgetType],
    layout: {
      x: 24,
      y: 24,
      width: widgetType === "table" ? 520 : 320,
      height: widgetType === "metric" ? 160 : 260,
    },
    binding: {
      aggregation: "count",
      operator: "equals",
    },
    text:
      widgetType === "text"
        ? "Tambahkan catatan, insight, atau instruksi untuk dashboard ini."
        : undefined,
    color: "#f97316",
  };
}

export const useDashboardStore = create<DashboardEditorState>((set, get) => ({
  isOpen: false,
  activeNodeId: null,
  source: null,
  rows: [],
  widgets: [],
  selectedWidgetId: null,
  isLoadingRows: false,
  errorMessage: null,

  openForNode: async ({ nodeId, config, fallbackSource }) => {
    const source = config?.source ?? fallbackSource ?? null;

    set({
      isOpen: true,
      activeNodeId: nodeId,
      source,
      widgets: config?.widgets ?? [],
      selectedWidgetId: null,
      errorMessage: null,
    });

    if (source) {
      await get().setSource(source);
    }
  },

  close: () =>
    set({
      isOpen: false,
      activeNodeId: null,
      selectedWidgetId: null,
    }),

  setSource: async (source) => {
    set({ source, isLoadingRows: true, errorMessage: null });

    try {
      const rows = await dashboardService.fetchRows({ ...source, limit: 200 });

      set({ rows });
    } catch {
      set({
        rows: [],
        errorMessage: "Gagal memuat data untuk dashboard.",
      });
    } finally {
      set({ isLoadingRows: false });
    }
  },

  addWidget: (widgetType) => {
    const newWidget = createDefaultWidget(widgetType);

    set((state) => ({
      widgets: [...state.widgets, newWidget],
      selectedWidgetId: newWidget.id,
    }));
  },

  updateWidget: (widgetId, widgetUpdate) =>
    set((state) => ({
      widgets: state.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, ...widgetUpdate } : widget,
      ),
    })),

  moveWidget: (widgetId, x, y) =>
    set((state) => ({
      widgets: state.widgets.map((widget) =>
        widget.id === widgetId
          ? { ...widget, layout: { ...widget.layout, x, y } }
          : widget,
      ),
    })),

  resizeWidget: (widgetId, width, height) =>
    set((state) => ({
      widgets: state.widgets.map((widget) =>
        widget.id === widgetId
          ? { ...widget, layout: { ...widget.layout, width, height } }
          : widget,
      ),
    })),

  removeWidget: (widgetId) =>
    set((state) => ({
      widgets: state.widgets.filter((widget) => widget.id !== widgetId),
      selectedWidgetId:
        state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
    })),

  selectWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

  getConfig: () => ({
    source: get().source ?? undefined,
    widgets: get().widgets,
  }),
}));
