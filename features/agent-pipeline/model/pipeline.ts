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
      title: "Balasan WhatsApp",
      subtitle: "Pesan masuk dari akun agen",
    },
  },
  {
    id: "gemini",
    type: "pipelineNode",
    position: { x: 320, y: 160 },
    data: {
      kind: "ai",
      title: "Gemini AI",
      subtitle: "Klasifikasi maksud & balasan",
    },
  },
  {
    id: "reply-answer",
    type: "pipelineNode",
    position: { x: 660, y: 20 },
    data: {
      kind: "reply",
      title: "Balas Pertanyaan",
      subtitle: "Jika pengguna hanya bertanya",
    },
  },
  {
    id: "database",
    type: "pipelineNode",
    position: { x: 660, y: 280 },
    data: {
      kind: "database",
      title: "Database",
      subtitle: "Simpan / jalankan otomasi",
    },
  },
  {
    id: "reply-confirm",
    type: "pipelineNode",
    position: { x: 980, y: 280 },
    data: {
      kind: "reply",
      title: "Konfirmasi WhatsApp",
      subtitle: "Kirim hasil aksi ke pengguna",
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
    label: "bertanya",
    animated: true,
  },
  {
    id: "e-gemini-database",
    source: "gemini",
    target: "database",
    label: "aksi",
    animated: true,
  },
  {
    id: "e-database-confirm",
    source: "database",
    target: "reply-confirm",
    animated: true,
  },
];
