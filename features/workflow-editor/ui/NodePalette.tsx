"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Button, Input, Icon, BrandIcon, ScrollArea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import {
  NODE_TYPES,
  NODE_FAMILIES,
  getNodeBrandIcon,
  useWorkflowStore,
  type NodeCategory,
  type NodeKind,
  type NodeFamily,
  type NodeBrandIcon,
} from "@/entities/workflow";

const CATEGORY_ORDER: NodeCategory[] = ["trigger", "action", "logic"];

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: "Input",
  action: "Action",
  logic: "Logic",
};

const CATEGORY_ICON_STYLES: Record<NodeCategory, string> = {
  trigger: "bg-emerald-100 text-emerald-600",
  action: "bg-blue-100 text-blue-600",
  logic: "bg-amber-100 text-amber-600",
};

/**
 * Satu kartu di palette. Node dengan family yang sama pada satu kategori
 * digabung jadi satu entri; klik menambahkan operasi default (kind pertama),
 * lalu operasi spesifik dipilih lewat dropdown di panel konfigurasi.
 */
interface PaletteEntry {
  id: string;
  label: string;
  description: string;
  icon: string;
  brand: NodeBrandIcon | null;
  defaultKind: NodeKind;
}

/**
 * Membangun daftar kartu untuk satu kategori: family digabung menjadi satu
 * kartu, node tanpa family tampil apa adanya. Urutan kemunculan dipertahankan.
 */
function buildPaletteEntries(category: NodeCategory): PaletteEntry[] {
  const entries: PaletteEntry[] = [];
  const seenFamilies = new Set<NodeFamily>();

  NODE_TYPES.filter((nodeType) => nodeType.category === category).forEach(
    (nodeType) => {
      if (!nodeType.family) {
        entries.push({
          id: nodeType.kind,
          label: nodeType.label,
          description: nodeType.description,
          icon: nodeType.icon,
          brand: getNodeBrandIcon(nodeType.kind),
          defaultKind: nodeType.kind,
        });

        return;
      }

      if (seenFamilies.has(nodeType.family)) {
        return;
      }

      seenFamilies.add(nodeType.family);

      const family = NODE_FAMILIES[nodeType.family];

      entries.push({
        id: `${category}:${nodeType.family}`,
        label: family.label,
        description: `${family.label} — pilih operasinya setelah ditambahkan.`,
        icon: family.icon,
        brand: getNodeBrandIcon(nodeType.kind),
        defaultKind: nodeType.kind,
      });
    },
  );

  return entries;
}

export function NodePalette() {
  const { addNodeByKind } = useWorkflowStore();
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchesSearch = (label: string) =>
    normalizedSearch.length === 0 ||
    label.toLowerCase().includes(normalizedSearch);

  const entriesByCategory = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        entries: buildPaletteEntries(category),
      })),
    [],
  );

  return (
    <aside className="border-border bg-card flex h-[calc(100vh-85px)]! w-64 shrink-0 flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border flex flex-col gap-3 border-b p-3">
        <h2 className="text-foreground text-sm font-semibold">Node Library</h2>

        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(changeEvent) => setSearchTerm(changeEvent.target.value)}
            placeholder="Search node or action..."
            className="pl-8"
          />
        </div>

        <Button className="w-full">
          <PlusIcon />
          Create Node
        </Button>
      </div>

      <ScrollArea className="h-full flex-1 pb-30">
        <div className="p-3">
          {entriesByCategory.map(({ category, entries }) => {
            const visibleEntries = entries.filter((entry) =>
              matchesSearch(entry.label),
            );

            if (visibleEntries.length === 0) {
              return null;
            }

            return (
              <div key={category} className="mb-5">
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  {CATEGORY_LABELS[category]}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {visibleEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      title={entry.description}
                      onClick={() => addNodeByKind(entry.defaultKind)}
                      className="border-border bg-background hover:border-primary/40 hover:bg-accent flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors"
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-md",
                          entry.brand
                            ? "ring-border bg-white ring-1"
                            : CATEGORY_ICON_STYLES[category],
                        )}
                      >
                        {entry.brand ? (
                          <BrandIcon name={entry.brand} className="size-3.5" />
                        ) : (
                          <Icon name={entry.icon} className="size-3.5" />
                        )}
                      </span>
                      <span className="text-foreground truncate text-xs font-medium">
                        {entry.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
