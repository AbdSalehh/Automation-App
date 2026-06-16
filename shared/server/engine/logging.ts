import { prisma } from "@/shared/lib/prisma";

/** Menulis satu baris log eksekusi. Server-only. */
export async function writeLog(
  executionId: string,
  level: "info" | "warn" | "error",
  message: string,
): Promise<void> {
  await prisma.log.create({ data: { executionId, level, message } });
}
