import { create } from "zustand";
import { executionService } from "../service/execution.service";
import type {
  Execution,
  ExecutionDetail,
  ExecutionStatus,
  NodeLog,
  InboundReply,
} from "../model/execution.model";

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

  fetchExecutions: (workflowId?: string) => Promise<void>;
  fetchExecutionDetail: (executionId: string) => Promise<void>;
  pollLatestStatus: (workflowId: string) => Promise<void>;
  loadNodeLogs: (executionId: string) => Promise<NodeLog[]>;
  pollInboundReplies: (workflowId: string) => Promise<InboundReply[]>;
  clearDetail: () => void;
}

/**
 * Penanda waktu balasan terakhir yang sudah ditampilkan, per workflow. Disimpan
 * di luar state Zustand karena hanya dipakai untuk deduplikasi toast, bukan UI.
 */
const lastReplyTimestampByWorkflow = new Map<string, string>();

export const useExecutionStore = create<ExecutionState>((set) => ({
  executions: [],
  selectedDetail: null,
  isLoading: false,
  isLoadingDetail: false,
  errorMessage: null,
  latestStatus: null,

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
   * Fetches the most recent execution and stores its status. Intended to be
   * polled by the editor so edges can animate while a run is in progress.
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

  /**
   * Mengambil balasan WhatsApp masuk yang BARU untuk sebuah workflow sejak
   * pemanggilan terakhir. Penanda waktu dilacak per workflow agar editor hanya
   * memunculkan toast untuk balasan yang belum pernah ditampilkan.
   */
  pollInboundReplies: async (workflowId) => {
    try {
      const since = lastReplyTimestampByWorkflow.get(workflowId);

      const replies = await executionService.listReplies(workflowId, since);

      if (replies.length > 0) {
        const latest = replies[replies.length - 1];
        lastReplyTimestampByWorkflow.set(workflowId, latest.receivedAt);
      } else if (!since) {
        /**
         * Panggilan pertama tanpa balasan: tandai "sekarang" sebagai garis
         * dasar agar balasan lama tidak ikut di-toast saat editor dibuka.
         */
        lastReplyTimestampByWorkflow.set(workflowId, new Date().toISOString());
      }

      return replies;
    } catch {
      return [];
    }
  },

  clearDetail: () => set({ selectedDetail: null }),
}));
