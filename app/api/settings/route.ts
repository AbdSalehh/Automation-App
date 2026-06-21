import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok } from "@/shared/api/http";

/**
 * Setelan editor per-pengguna.
 *
 * GET — kembalikan setelan; bila belum ada, buat dengan nilai default.
 * PUT — simpan setelan (upsert) dengan nilai yang sudah dibatasi rentangnya.
 */

const CONNECTION_MODES = ["bezier", "smoothstep", "step", "straight"];

interface SettingBody {
  fontSize?: number;
  showGrid?: boolean;
  gridSize?: number;
  snapToGrid?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  connectionMode?: string;
  animationSpeed?: number;
}

/** Membatasi angka pada rentang aman agar kanvas tidak rusak. */
function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/** Membentuk objek setelan dari record Prisma (tanpa kolom internal). */
function toSettingResponse(record: {
  fontSize: number;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showMinimap: boolean;
  showControls: boolean;
  connectionMode: string;
  animationSpeed: number;
}) {
  return {
    fontSize: record.fontSize,
    showGrid: record.showGrid,
    gridSize: record.gridSize,
    snapToGrid: record.snapToGrid,
    showMinimap: record.showMinimap,
    showControls: record.showControls,
    connectionMode: record.connectionMode,
    animationSpeed: record.animationSpeed,
  };
}

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const existing = await prisma.userSetting.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return ok(toSettingResponse(existing), "Setelan editor");
    }

    const created = await prisma.userSetting.create({
      data: { userId: user.id },
    });

    return ok(toSettingResponse(created), "Setelan editor default dibuat");
  });
}

export async function PUT(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as SettingBody;

    const connectionMode = CONNECTION_MODES.includes(
      String(body.connectionMode),
    )
      ? String(body.connectionMode)
      : "bezier";

    const data = {
      fontSize: clampNumber(body.fontSize, 10, 24, 14),
      showGrid: Boolean(body.showGrid),
      gridSize: clampNumber(body.gridSize, 8, 64, 20),
      snapToGrid: Boolean(body.snapToGrid),
      showMinimap: Boolean(body.showMinimap),
      showControls: Boolean(body.showControls),
      connectionMode,
      animationSpeed: clampNumber(body.animationSpeed, 100, 2000, 400),
    };

    const saved = await prisma.userSetting.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    return ok(toSettingResponse(saved), "Setelan berhasil disimpan");
  });
}
