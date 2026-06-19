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
      hint: "Semua kredensial tersimpan",
      hintClass: "text-muted-foreground",
      icon: LockIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Encrypted",
      value: encrypted,
      hint: "100% terenkripsi (AES-256-GCM)",
      hintClass: "text-emerald-600",
      icon: ShieldCheckIcon,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Terhubung",
      value: connected,
      hint: "Koneksi aktif dan valid",
      hintClass: "text-muted-foreground",
      icon: ZapIcon,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Expired",
      value: expired,
      hint: "Perlu diperbarui",
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
