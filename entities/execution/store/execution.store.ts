import { create } from "zustand";
import type * as Ably from "ably";
import { acquireAblyClient, releaseAblyClient } from "@/shared/lib/ablyClient";
import { executionService } from "../service/execution.service";
import type {
  Execution,
  ExecutionDetail,
  ExecutionStatus,
  NodeLog,
} from "../model/execution.model";

/**
 * Payload event `execution-update` yang dipublish server saat sebuah eksekusi
 * berjalan/selesai (run manual, webhook balasan, maupun schedule).
 */
interface ExecutionUpdateEvent {
  executionId: string;
  workflowId: string;
  status: "running" | "success" | "failed" | "paused";
}

/**
 * Execution store. Per coding rule #6, fetching and loading state for
 * executions and their details are owned here.
 */
interface ExecutionState {
  executions: Execution[];
  selectedDetail: ExecutionDetail | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  errorMessage: string | null;

  /** Status of the most recent execution, used to animate running edges. */
  latestStatus: ExecutionStatus | null;

  /** Id eksekusi terakhir yang diterima realtime, untuk memicu animasi run. */
  realtimeExecutionId: string | null;

  /** Channel langganan `execution-update` lewat koneksi Ably bersama. */
  channel: Ably.RealtimeChannel | null;

  fetchExecutions: (workflowId?: string) => Promise<void>;
  fetchExecutionDetail: (executionId: string) => Promise<void>;
  pollLatestStatus: (workflowId: string) => Promise<void>;
  subscribeExecutions: (sessionId: string) => void;
  unsubscribeExecutions: () => void;
  loadNodeLogs: (executionId: string) => Promise<NodeLog[]>;
  clearDetail: () => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  executions: [],
  selectedDetail: null,
  isLoading: false,
  isLoadingDetail: false,
  errorMessage: null,
  latestStatus: null,
  realtimeExecutionId: null,
  channel: null,

  fetchExecutions: async (workflowId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const executions = await executionService.list(workflowId);
      set({ executions });
    } catch {
      set({ errorMessage: "Gagal memuat eksekusi." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchExecutionDetail: async (executionId) => {
    set({ isLoadingDetail: true, selectedDetail: null });

    try {
      const detail = await executionService.getById(executionId);
      set({ selectedDetail: detail });
    } catch {
      set({ errorMessage: "Gagal memuat detail eksekusi." });
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  /**
   * Mengambil status eksekusi terbaru sekali (mis. saat editor dibuka) untuk
   * menetapkan state awal. Update berikutnya datang realtime lewat Ably.
   */
  pollLatestStatus: async (workflowId) => {
    try {
      const executions = await executionService.list(workflowId);
      const latest = executions[0] ?? null;

      set({ latestStatus: latest ? latest.status : null });
    } catch {
      set({ latestStatus: null });
    }
  },

  /**
   * Berlangganan event `execution-update` lewat koneksi Ably bersama. Saat ada
   * eksekusi baru berjalan (run manual, webhook balasan, atau schedule), id-nya
   * disimpan agar editor dapat memutar animasi run berurutan.
   */
  subscribeExecutions: (sessionId) => {
    if (get().channel) {
      return;
    }

    const ablyClient = acquireAblyClient();

    const channel = ablyClient.channels.get(`session:${sessionId}`);

    channel.subscribe("execution-update", (ablyMessage) => {
      const update = ablyMessage.data as ExecutionUpdateEvent;

      const status: ExecutionStatus =
        update.status === "success" || update.status === "failed"
          ? update.status
          : "running";

      set({
        latestStatus: status,
        realtimeExecutionId: update.executionId,
      });
    });

    set({ channel });
  },

  /** Berhenti berlangganan dan melepas satu referensi koneksi bersama. */
  unsubscribeExecutions: () => {
    const { channel } = get();

    if (channel) {
      channel.unsubscribe();
      releaseAblyClient();
    }

    set({ channel: null });
  },

  /**
   * Mengambil nodeLogs (terurut) dari sebuah eksekusi tanpa mengubah
   * `selectedDetail`. Dipakai animasi run untuk memutar urutan node yang
   * benar-benar dieksekusi.
   */
  loadNodeLogs: async (executionId) => {
    try {
      const detail = await executionService.getById(executionId);
      return detail.nodeLogs;
    } catch {
      return [];
    }
  },

  clearDetail: () => set({ selectedDetail: null }),
}));
