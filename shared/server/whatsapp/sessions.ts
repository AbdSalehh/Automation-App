/**
 * Helper kunci sesi WhatsApp untuk model dua akun per pengguna.
 *
 * Setiap pengguna dapat menautkan DUA akun WhatsApp:
 * 1. Akun agen (channel "agent") — antarmuka chat-action bertenaga Gemini,
 *    memakai kunci sesi sama dengan id pengguna.
 * 2. Akun workflow (channel "workflow") — dipakai node kirim/balasan di dalam
 *    workflow, memakai kunci sesi `${userId}__wf`.
 *
 * Service Baileys hanya melihat kunci sebagai string unik, sehingga kedua akun
 * berjalan sebagai sesi terpisah tanpa perubahan di backend.
 */

const WORKFLOW_SUFFIX = "__wf";

export type WhatsappChannel = "agent" | "workflow";

/** Kunci sesi untuk akun agen (sama dengan id pengguna). */
export function agentSessionId(userId: string): string {
  return userId;
}

/** Kunci sesi untuk akun workflow (`${userId}__wf`). */
export function workflowSessionId(userId: string): string {
  return `${userId}${WORKFLOW_SUFFIX}`;
}

/**
 * Mengurai kunci sesi mentah dari webhook menjadi id pemilik dan channel-nya.
 * Kunci berakhiran `__wf` dianggap akun workflow, selain itu akun agen.
 */
export function parseSessionId(rawSessionId: string): {
  ownerId: string;
  channel: WhatsappChannel;
} {
  if (rawSessionId.endsWith(WORKFLOW_SUFFIX)) {
    return {
      ownerId: rawSessionId.slice(0, -WORKFLOW_SUFFIX.length),
      channel: "workflow",
    };
  }

  return { ownerId: rawSessionId, channel: "agent" };
}

/** Mengembalikan kunci sesi sesuai channel yang diminta. */
export function sessionIdForChannel(
  userId: string,
  channel: WhatsappChannel,
): string {
  return channel === "workflow"
    ? workflowSessionId(userId)
    : agentSessionId(userId);
}
