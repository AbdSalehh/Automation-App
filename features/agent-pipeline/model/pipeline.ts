import type { Node, Edge } from "@xyflow/react";

/**
 * Definisi statis pipeline agen chat-action untuk kanvas read-only di halaman
 * setelan. Menggambarkan alur tetap: balasan WhatsApp masuk ke akun agen,
 * diproses Gemini, lalu bercabang menjadi jawaban langsung (bila bertanya) atau
 * tulis database + konfirmasi (bila aksi). Data ini tidak bisa diedit pengguna.
 */

export type PipelineNodeKind = "trigger" | "ai" | "database" | "reply";

export interface PipelineNodeData extends Record<string, unknown> {
  kind: PipelineNodeKind;
  title: string;
  subtitle: string;
}

export const AGENT_PIPELINE_NODES: Node<PipelineNodeData>[] = [
  {
    id: "trigger",
    type: "pipelineNode",
    position: { x: 0, y: 160 },
    data: {
      kind: "trigger",
      title: "Telegram Message",
      subtitle: "Incoming message from the agent bot",
    },
  },
  {
    id: "gemini",
    type: "pipelineNode",
    position: { x: 320, y: 160 },
    data: {
      kind: "ai",
      title: "Gemini AI",
      subtitle: "Intent classification & reply",
    },
  },
  {
    id: "reply-answer",
    type: "pipelineNode",
    position: { x: 660, y: 20 },
    data: {
      kind: "reply",
      title: "Answer Question",
      subtitle: "When the user only asks a question",
    },
  },
  {
    id: "database",
    type: "pipelineNode",
    position: { x: 660, y: 280 },
    data: {
      kind: "database",
      title: "Database",
      subtitle: "Save / run automation",
    },
  },
  {
    id: "reply-confirm",
    type: "pipelineNode",
    position: { x: 980, y: 280 },
    data: {
      kind: "reply",
      title: "Telegram Confirmation",
      subtitle: "Send the action result to the user",
    },
  },
];

export const AGENT_PIPELINE_EDGES: Edge[] = [
  {
    id: "e-trigger-gemini",
    source: "trigger",
    target: "gemini",
    animated: true,
  },
  {
    id: "e-gemini-answer",
    source: "gemini",
    target: "reply-answer",
    label: "question",
    animated: true,
  },
  {
    id: "e-gemini-database",
    source: "gemini",
    target: "database",
    label: "action",
    animated: true,
  },
  {
    id: "e-database-confirm",
    source: "database",
    target: "reply-confirm",
    animated: true,
  },
];
