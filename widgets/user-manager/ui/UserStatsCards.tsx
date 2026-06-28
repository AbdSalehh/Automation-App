"use client";

import { useMemo } from "react";
import {
  UsersIcon,
  UserCheckIcon,
  ShieldCheckIcon,
  UserXIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { ManagedUser } from "@/entities/managed-user";
import { motion } from "motion/react";
import { staggerItem } from "@/shared/lib/motion-presets";

interface UserStatsCardsProps {
  users: ManagedUser[];
}

interface StatCard {
  key: string;
  label: string;
  value: number;
  subLabel: string;
  percentage: number;
  icon: typeof UsersIcon;
  iconClassName: string;
  ringClassName: string;
}

/**
 * Donut indikator persentase berbasis SVG. `dashoffset` bersifat dinamis
 * (kalkulasi runtime) sehingga inline style diperbolehkan sesuai aturan.
 */
function PercentageRing({
  percentage,
  className,
}: {
  percentage: number;
  className: string;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex size-12 shrink-0 items-center justify-center">
      <svg className="size-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-gray-100"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={className}
        />
      </svg>
      <span className="text-foreground absolute text-[11px] font-bold">
        {percentage}%
      </span>
    </div>
  );
}

/**
 * Baris kartu statistik pengguna. Seluruh angka dihitung dari daftar user nyata
 * (tanpa data palsu): total, aktif, admin, dan non-aktif.
 */
export function UserStatsCards({ users }: UserStatsCardsProps) {
  const cards = useMemo<StatCard[]>(() => {
    const total = users.length;

    const activeCount = users.filter(
      (user) => user.approvalStatus === "approved" && user.isActive,
    ).length;

    const adminCount = users.filter((user) => user.role === "admin").length;

    const inactiveCount = users.filter((user) => !user.isActive).length;

    const pendingCount = users.filter(
      (user) => user.approvalStatus === "pending",
    ).length;

    const toPercentage = (count: number) =>
      total === 0 ? 0 : Math.round((count / total) * 100);

    return [
      {
        key: "total",
        label: "Total Users",
        value: total,
        subLabel: `${pendingCount} pending approval`,
        percentage: 100,
        icon: UsersIcon,
        iconClassName: "bg-orange-50 text-orange-600",
        ringClassName: "stroke-orange-500",
      },
      {
        key: "active",
        label: "Active Users",
        value: activeCount,
        subLabel: `${toPercentage(activeCount)}% of total users`,
        percentage: toPercentage(activeCount),
        icon: UserCheckIcon,
        iconClassName: "bg-emerald-50 text-emerald-600",
        ringClassName: "stroke-emerald-500",
      },
      {
        key: "admin",
        label: "Admin",
        value: adminCount,
        subLabel: "Has full access",
        percentage: toPercentage(adminCount),
        icon: ShieldCheckIcon,
        iconClassName: "bg-violet-50 text-violet-600",
        ringClassName: "stroke-violet-500",
      },
      {
        key: "inactive",
        label: "Inactive",
        value: inactiveCount,
        subLabel: `${toPercentage(inactiveCount)}% of total users`,
        percentage: toPercentage(inactiveCount),
        icon: UserXIcon,
        iconClassName: "bg-sky-50 text-sky-600",
        ringClassName: "stroke-sky-500",
      },
    ];
  }, [users]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const CardIcon = card.icon;

        return (
          <motion.div
            key={card.label}
            variants={staggerItem}
            className="border-border/50 bg-card/50 fill-mode-backwards relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border p-5 backdrop-blur"
          >
            <div className="from-primary/6 absolute inset-0 bg-linear-to-br to-transparent" />
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg",
                  card.iconClassName,
                )}
              >
                <CardIcon className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-medium">
                  {card.label}
                </span>
                <span className="text-foreground text-2xl leading-none font-bold">
                  {card.value}
                </span>
                <span className="text-muted-foreground mt-1 text-[11px]">
                  {card.subLabel}
                </span>
              </div>
            </div>

            <PercentageRing
              percentage={card.percentage}
              className={card.ringClassName}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
