"use client";

import { LockIcon, ShieldCheckIcon, ZapIcon, KeyRoundIcon } from "lucide-react";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion-presets";
import { cn } from "@/shared/lib/utils";

interface CredentialStatsCardsProps {
  total: number;
  encrypted: number;
  connected: number;
  expired: number;
}

/** Empat kartu ringkasan kredensial di atas tabel (gambar 1). */
export function CredentialStatsCards({
  total,
  encrypted,
  connected,
  expired,
}: CredentialStatsCardsProps) {
  const cards = [
    {
      label: "Total Credentials",
      value: total,
      hint: "All stored credentials",
      hintClass: "text-muted-foreground",
      icon: LockIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Encrypted",
      value: encrypted,
      hint: "100% encrypted (AES-256-GCM)",
      hintClass: "text-emerald-600",
      icon: ShieldCheckIcon,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Connected",
      value: connected,
      hint: "Active and valid connections",
      hintClass: "text-muted-foreground",
      icon: ZapIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Expired",
      value: expired,
      hint: "Needs renewal",
      hintClass: "text-muted-foreground",
      icon: KeyRoundIcon,
      iconClass: "bg-amber-100 text-amber-600",
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
          className="border-border/50 bg-card/50 fill-mode-backwards relative overflow-hidden rounded-2xl border p-5 backdrop-blur"
        >
          <div className="from-primary/6 absolute inset-0 bg-linear-to-br to-transparent" />
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
              <span className="text-muted-foreground text-sm">
                {card.label}
              </span>
              <span className="text-foreground text-3xl font-bold">
                {card.value}
              </span>
              <span className={cn("text-xs", card.hintClass)}>{card.hint}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
