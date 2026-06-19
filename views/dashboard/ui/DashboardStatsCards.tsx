"use client";

import { ZapIcon, LockIcon, BarChart3Icon, LayersIcon } from "lucide-react";
import { motion } from "motion/react";
import { Sparkline } from "@/shared/ui";
import { staggerContainer, staggerItem } from "@/shared/lib/motion-presets";
import { cn } from "@/shared/lib/utils";

interface DashboardStatsCardsProps {
  activeWorkflows: number;
  credentials: number;
}

/** Empat kartu statistik utama dashboard dengan sparkline (gambar 1). */
export function DashboardStatsCards({
  activeWorkflows,
  credentials,
}: DashboardStatsCardsProps) {
  const cards = [
    {
      label: "Active Workflows",
      value: String(activeWorkflows),
      hint: "↑ 12% vs yesterday",
      hintClass: "text-emerald-600",
      icon: ZapIcon,
      iconClass: "bg-orange-100 text-orange-600",
      trend: [12, 18, 14, 22, 19, 26, 24],
      trendColor: "#f97316",
    },
    {
      label: "Credentials",
      value: String(credentials),
      hint: "AES-256-GCM encrypted",
      hintClass: "text-muted-foreground",
      icon: LockIcon,
      iconClass: "bg-slate-100 text-slate-500",
      trend: null,
      trendColor: "#f97316",
    },
    {
      label: "Executions Today",
      value: "4,928",
      hint: "↑ 98.2% success rate",
      hintClass: "text-emerald-600",
      icon: BarChart3Icon,
      iconClass: "bg-orange-100 text-orange-600",
      trend: [40, 52, 48, 61, 55, 67, 72],
      trendColor: "#f97316",
    },
    {
      label: "Redis Cache",
      value: "Healthy",
      valueClass: "text-emerald-600",
      hint: "2ms avg latency",
      hintClass: "text-muted-foreground",
      icon: LayersIcon,
      iconClass: "bg-emerald-100 text-emerald-600",
      trend: [88, 91, 89, 94, 92, 96, 98],
      trendColor: "#10b981",
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
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                card.iconClass,
              )}
            >
              <card.icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-muted-foreground text-xs">
                {card.label}
              </span>
              <span
                className={cn(
                  "text-foreground text-2xl font-bold",
                  card.valueClass,
                )}
              >
                {card.value}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <span className={cn("text-xs", card.hintClass)}>{card.hint}</span>
            {card.trend && (
              <div className="h-8 w-20">
                <Sparkline
                  data={card.trend}
                  color={card.trendColor}
                  height={32}
                />
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
