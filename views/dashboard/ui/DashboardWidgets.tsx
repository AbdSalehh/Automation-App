"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button, BrandIcon, Sparkline } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

interface DashboardGreetingProps {
  name: string;
}

/** Header sapaan dashboard dengan tombol aksi utama. */
export function DashboardGreeting({ name }: DashboardGreetingProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-foreground text-2xl font-bold">
          Good morning, {name}! 👋
        </h1>
        <p className="text-muted-foreground text-sm">
          Here&apos;s what&apos;s happening with your automation today.
        </p>
      </div>
    </div>
  );
}

/** Kartu "Cache Hit Rate" dengan line chart di dashboard. */
export function DashboardCacheCard() {
  const cacheTrend = [92, 94, 91, 95, 93, 97, 96, 98];

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-foreground text-sm font-semibold">
          Cache Hit Rate
        </h3>
        <span className="text-xs font-medium text-orange-500">
          View details
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-foreground text-3xl font-bold">98.2%</span>
        <span className="pb-1 text-xs text-emerald-600">
          ↑ 5.6% vs yesterday
        </span>
      </div>

      <div className="mt-3">
        <Sparkline data={cacheTrend} height={72} />
      </div>
    </div>
  );
}

/** Bar "Popular Integrations" dengan logo brand di dashboard. */
export function DashboardIntegrationsBar() {
  const integrations = [
    { name: "Google Sheets", brand: "google-sheets" as const },
    { name: "WhatsApp Business", brand: "whatsapp" as const },
    { name: "Gmail", brand: "gmail" as const },
    { name: "Telegram", brand: "telegram" as const },
    { name: "Calendar", brand: "google-calendar" as const },
  ];

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h3 className="text-foreground mb-4 text-sm font-semibold">
        Popular Integrations
      </h3>

      <div className="flex flex-wrap gap-3">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="border-border flex items-center gap-2 rounded-xl border px-4 py-2.5"
          >
            <BrandIcon name={integration.brand} className="size-5" />
            <span className="text-foreground text-sm font-medium">
              {integration.name}
            </span>
          </div>
        ))}
        <div className="border-border text-muted-foreground flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm">
          <PlusIcon className="size-4" />
          More
        </div>
      </div>
    </div>
  );
}
