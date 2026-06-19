"use client";

import Link from "next/link";
import { PlusIcon, UploadIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { Button, BrandIcon } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

/** Satu node statis pada ilustrasi overview. */
function OverviewNode({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card flex w-40 items-center gap-2 rounded-xl border px-3 py-2.5 shadow-sm">
      <span className="bg-muted grid size-8 shrink-0 place-items-center rounded-lg">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-foreground truncate text-xs font-semibold">
          {title}
        </span>
        <span className="text-muted-foreground truncate text-[10px]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

/**
 * Panel "Workflow Overview" pada dashboard: ajakan utama + ilustrasi alur node
 * statis dengan ikon brand (gambar 1).
 */
export function DashboardOverviewPanel() {
  return (
    <div className="border-border bg-card grid gap-6 rounded-2xl border p-6 lg:grid-cols-[320px_1fr] lg:p-8">
      <div className="flex flex-col">
        <span className="text-xs font-bold tracking-widest text-orange-500 uppercase">
          Workflow Overview
        </span>
        <h2 className="text-foreground mt-3 text-2xl leading-tight font-bold">
          Visualize. Automate.
          <br />
          Get things done.
        </h2>
        <p className="text-muted-foreground mt-3 text-sm">
          Build, run, and monitor powerful workflows with our intuitive
          drag-and-drop editor.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={ROUTES.workflows}>
            <Button className="gap-2 bg-orange-500 text-white hover:bg-orange-600">
              <PlusIcon className="size-4" />
              New Workflow
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <UploadIcon className="size-4" />
            Import Workflow
          </Button>
        </div>
      </div>

      <div className="border-border bg-muted/30 relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed bg-[radial-gradient(circle,rgba(148,163,184,0.25)_1px,transparent_1px)] bg-size-[18px_18px] p-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <OverviewNode
            title="Cron Trigger"
            subtitle="Every 1 hour"
            icon={<ClockIcon className="size-4 text-amber-500" />}
          />
          <span className="bg-border hidden h-px w-6 lg:block" />
          <OverviewNode
            title="Google Sheets"
            subtitle="Read rows"
            icon={<BrandIcon name="google-sheets" className="size-4" />}
          />
          <span className="bg-border hidden h-px w-6 lg:block" />
          <OverviewNode
            title="IF Condition"
            subtitle="Status is New"
            icon={<GitBranchIcon className="size-4 text-orange-500" />}
          />
          <div className="flex flex-col gap-3">
            <OverviewNode
              title="WhatsApp Send"
              subtitle="Send message"
              icon={<BrandIcon name="whatsapp" className="size-4" />}
            />
            <OverviewNode
              title="Log Result"
              subtitle="Simple log"
              icon={<ClockIcon className="size-4 text-slate-400" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
