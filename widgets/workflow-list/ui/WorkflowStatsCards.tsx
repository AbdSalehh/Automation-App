"use client";

import { ZapIcon, FlameIcon, BarChart3Icon, FileTextIcon } from "lucide-react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion-presets";
import { cn } from "@/shared/lib/utils";

interface WorkflowStatsCardsProps {
  total: number;
  active: number;
  draft: number;
  totalExecutions: number;
}

/** Empat kartu ringkasan status workflow di atas tabel (gambar 2). */
export function WorkflowStatsCards({
  total,
  active,
  draft,
  totalExecutions,
}: WorkflowStatsCardsProps) {
  const cards = [
    {
      label: "Total Workflows",
      value: total,
      hint: `${total} total`,
      hintClass: "text-muted-foreground",
      icon: ZapIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Active",
      value: active,
      hint: percentOf(active, total),
      hintClass: "text-muted-foreground",
      icon: FlameIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Draft",
      value: draft,
      hint: percentOf(draft, total),
      hintClass: "text-muted-foreground",
      icon: FileTextIcon,
      iconClass: "bg-slate-100 text-slate-500",
    },
    {
      label: "Total Executions",
      value: totalExecutions,
      hint: "Semua waktu",
      hintClass: "text-muted-foreground",
      icon: BarChart3Icon,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={staggerItem}
          className="border-border bg-card rounded-2xl border p-5"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm">
                {card.label}
              </span>
              <span className="text-foreground text-3xl font-bold">
                {card.value}
              </span>
              <span className={cn("text-xs", card.hintClass)}>{card.hint}</span>
            </div>

            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                card.iconClass,
              )}
            >
              <card.icon className="size-5" />
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Format "x.x% of total" untuk hint kartu. */
function percentOf(value: number, total: number): string {
  if (total === 0) {
    return "0% of total";
  }

  return `${((value / total) * 100).toFixed(1)}% of total`;
}
