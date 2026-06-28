import { create } from "zustand";
import {
  nodeTestService,
  type NodeTestResult,
} from "../service/node-test.service";
import { sheetPreviewService } from "../service/sheet-preview.service";
import type { FlowNode } from "../model/workflow.model";

/** Connector/source where real rows can be sampled for a realistic test. */
interface SheetSource {
  credentialId: string;
  spreadsheetId: string;
  sheetName?: string;
}

/** Node kinds that operate on a collection of rows from an upstream Read. */
const ROW_CONSUMING_KINDS = new Set([
  "condition",
  "filter",
  "transform",
  "date_calculator",
  "whatsapp_send",
  "google_sheets_update",
]);

interface NodeTestState {
  /** Test results keyed by node id. */
  resultByNodeId: Record<string, NodeTestResult>;
  /** Whether the last test for a node ran against real sheet rows. */
  usedRealDataByNodeId: Record<string, boolean>;
  /** Node id currently running a test, or null. */
  runningNodeId: string | null;
  runNodeTest: (params: {
    workflowId: string;
    node: FlowNode;
    sampleInput?: unknown;
    /** Sheet sources used to fetch real sample rows when relevant. */
    sheetSources?: SheetSource[];
  }) => Promise<void>;
  clearResult: (nodeId: string) => void;
}

export const useNodeTestStore = create<NodeTestState>((set, get) => ({
  resultByNodeId: {},
  usedRealDataByNodeId: {},
  runningNodeId: null,

  runNodeTest: async ({ workflowId, node, sampleInput, sheetSources }) => {
    set({ runningNodeId: node.id });

    let effectiveInput = sampleInput;
    let usedRealData = false;

    /** For row-consuming nodes, seed the test with real spreadsheet rows. */
    const firstSource = sheetSources?.[0];

    if (ROW_CONSUMING_KINDS.has(node.data.kind) && firstSource) {
      try {
        const rows = await sheetPreviewService.fetchRows({
          credentialId: firstSource.credentialId,
          spreadsheetId: firstSource.spreadsheetId,
          sheetName: firstSource.sheetName,
          limit: 20,
        });

        if (rows.length > 0) {
          effectiveInput = { rows };
          usedRealData = true;
        }
      } catch {
        /** Fall back to the provided sample input on fetch failure. */
      }
    }

    try {
      const result = await nodeTestService.run({
        workflowId,
        node,
        sampleInput: effectiveInput,
      });

      set({
        resultByNodeId: { ...get().resultByNodeId, [node.id]: result },
        usedRealDataByNodeId: {
          ...get().usedRealDataByNodeId,
          [node.id]: usedRealData,
        },
      });
    } catch (error) {
      set({
        resultByNodeId: {
          ...get().resultByNodeId,
          [node.id]: {
            ok: false,
            error:
              error instanceof Error ? error.message : "Failed to run the test",
          },
        },
      });
    } finally {
      set({ runningNodeId: null });
    }
  },

  clearResult: (nodeId) => {
    const nextResults = { ...get().resultByNodeId };
    delete nextResults[nodeId];
    set({ resultByNodeId: nextResults });
  },
}));
