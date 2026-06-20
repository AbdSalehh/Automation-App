import { resolveTemplate } from "@/shared/server/templating";
import type { Item, NodeHandler } from "../types";
import { toItems } from "../utils";

/**
 * Switch — percabangan multi-arah. Membandingkan nilai sebuah field terhadap
 * daftar `cases`, lalu meneruskan hanya baris yang cocok dengan nilai target.
 *
 * Config:
 *   - field: nama field yang dievaluasi (mendukung {{template}}).
 *   - value: nilai target yang dicocokkan (mendukung {{template}}).
 */
export const switchHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);

  const field = String(config.field ?? "").trim();
  const targetRaw = String(config.value ?? "").trim();

  const resolveCell = (item: Item): string => {
    if (field.includes("{{")) {
      return resolveTemplate(field, item).trim();
    }

    return String(item[field] ?? "").trim();
  };

  const matchedRows = items.filter((item) => {
    const target = resolveTemplate(targetRaw, item).trim();

    return resolveCell(item) === target;
  });

  return {
    matched: matchedRows.length > 0,
    value: targetRaw,
    rows: matchedRows,
    totalRows: matchedRows.length,
  };
};

/**
 * Merge — menggabungkan baris dari input (termasuk hasil beberapa cabang yang
 * sudah terkumpul menjadi satu array) menjadi satu aliran data tunggal.
 */
export const mergeHandler: NodeHandler = async ({ input }) => {
  const items = toItems(input);

  return {
    rows: items,
    totalRows: items.length,
  };
};

/**
 * Loop (Split In Batches) — memecah array masuk menjadi batch berukuran
 * `batchSize` (default 1) agar node berikutnya memproses bertahap.
 */
export const loopHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);

  const batchSize = Math.max(1, Number(config.batchSize ?? 1));

  const batches: Item[][] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    batches.push(items.slice(index, index + batchSize));
  }

  return {
    batch: batches[0] ?? [],
    batchIndex: 0,
    totalBatches: batches.length,
    rows: items,
  };
};

/**
 * No Operation — meneruskan input apa adanya. Berguna sebagai penanda akhir
 * cabang atau placeholder yang belum diisi.
 */
export const noOpHandler: NodeHandler = async ({ input }) => {
  const items = toItems(input);

  return { rows: items };
};
