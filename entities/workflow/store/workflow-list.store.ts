import { create } from "zustand";
import type * as Ably from "ably";
import { acquireAblyClient, releaseAblyClient } from "@/shared/lib/ablyClient";
import { workflowService } from "../service/workflow.service";
import type {
  WorkflowSummary,
  FlowNode,
  FlowEdge,
} from "../model/workflow.model";

/** Data workflow yang diimpor dari berkas JSON (tanpa id/owner/versi). */
export interface WorkflowImportInput {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/**
 * Payload event `workflow-update` yang dipublish server saat workflow
 * dibuat/diubah/dihapus (termasuk lewat agen chat Telegram).
 */
interface WorkflowUpdateEvent {
  action: "created" | "updated" | "deleted";
  workflowId: string;
}

/**
 * Store for the workflow list page. Per coding rule #6, fetching and loading
 * state are owned here, not in the list component.
 */
interface WorkflowListState {
  workflows: WorkflowSummary[];
  isLoading: boolean;
  isCreating: boolean;
  isImporting: boolean;
  errorMessage: string | null;

  /** Channel langganan `workflow-update` lewat koneksi Ably bersama. */
  channel: Ably.RealtimeChannel | null;

  fetchWorkflows: () => Promise<void>;
  createWorkflow: (name: string) => Promise<string | null>;
  importWorkflow: (transfer: WorkflowImportInput) => Promise<string | null>;
  removeWorkflow: (workflowId: string) => Promise<void>;
  subscribeRealtime: (sessionId: string) => void;
  unsubscribeRealtime: () => void;
}

export const useWorkflowListStore = create<WorkflowListState>((set, get) => ({
  workflows: [],
  isLoading: false,
  isCreating: false,
  isImporting: false,
  errorMessage: null,
  channel: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const workflows = await workflowService.list();
      set({ workflows });
    } catch {
      set({ errorMessage: "Gagal memuat workflow." });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkflow: async (name) => {
    set({ isCreating: true, errorMessage: null });

    try {
      const createdWorkflow = await workflowService.create({ name });
      set((state) => ({
        workflows: [
          {
            id: createdWorkflow.id,
            name: createdWorkflow.name,
            version: createdWorkflow.version,
            isPublished: createdWorkflow.isPublished,
            updatedAt: createdWorkflow.updatedAt,
            nodeCount: createdWorkflow.nodes.length,
            triggerKind: null,
            executionCount: 0,
            lastExecutionStatus: null,
            lastExecutionAt: null,
          },
          ...state.workflows,
        ],
      }));

      return createdWorkflow.id;
    } catch {
      set({ errorMessage: "Gagal membuat workflow." });

      return null;
    } finally {
      set({ isCreating: false });
    }
  },

  /**
   * Mengimpor workflow dari berkas JSON: membuat workflow baru lalu menulis
   * nodes/edges hasil impor, kemudian menyegarkan daftar. Mengembalikan id
   * workflow baru bila berhasil.
   */
  importWorkflow: async (transfer) => {
    set({ isImporting: true, errorMessage: null });

    try {
      const createdWorkflow = await workflowService.create({
        name: transfer.name,
      });

      /**
       * Pastikan setiap node punya ref stabil. Ekspor lama mungkin belum
       * menyimpan ref, jadi isi yang kosong tanpa menimpa yang sudah ada.
       */
      const usedRefs = new Set(
        transfer.nodes
          .map((node) => node.data.ref)
          .filter((ref): ref is string => Boolean(ref)),
      );

      let candidateIndex = 1;

      const nodesWithRefs = transfer.nodes.map((node) => {
        if (node.data.ref) {
          return node;
        }

        while (usedRefs.has(`n${candidateIndex}`)) {
          candidateIndex += 1;
        }

        const assignedRef = `n${candidateIndex}`;
        usedRefs.add(assignedRef);

        return { ...node, data: { ...node.data, ref: assignedRef } };
      });

      await workflowService.update(createdWorkflow.id, {
        nodes: nodesWithRefs,
        edges: transfer.edges,
        bumpVersion: true,
      });

      await get().fetchWorkflows();

      return createdWorkflow.id;
    } catch {
      set({ errorMessage: "Gagal mengimpor workflow." });

      return null;
    } finally {
      set({ isImporting: false });
    }
  },

  removeWorkflow: async (workflowId) => {
    await workflowService.remove(workflowId);
    set((state) => ({
      workflows: state.workflows.filter(
        (workflow) => workflow.id !== workflowId,
      ),
    }));
  },

  /**
   * Berlangganan event `workflow-update` lewat koneksi Ably bersama. Saat ada
   * perubahan workflow (termasuk dari agen Telegram), daftar di-fetch ulang
   * sehingga halaman tetap sinkron tanpa refresh manual.
   */
  subscribeRealtime: (sessionId) => {
    if (get().channel) {
      return;
    }

    const ablyClient = acquireAblyClient();

    const channel = ablyClient.channels.get(`session:${sessionId}`);

    channel.subscribe("workflow-update", (ablyMessage) => {
      const update = ablyMessage.data as WorkflowUpdateEvent;

      if (!update?.workflowId) {
        return;
      }

      get().fetchWorkflows();
    });

    set({ channel });
  },

  /** Berhenti berlangganan dan melepas satu referensi koneksi bersama. */
  unsubscribeRealtime: () => {
    const { channel } = get();

    if (channel) {
      channel.unsubscribe();
      releaseAblyClient();
    }

    set({ channel: null });
  },
}));
