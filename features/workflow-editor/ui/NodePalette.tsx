"use client";

import { useState } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Button, Input, Icon } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import {
  NODE_TYPES,
  useWorkflowStore,
  type NodeCategory,
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

export function NodePalette() {
  const { addNodeByKind } = useWorkflowStore();
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const matchesSearch = (label: string) =>
    normalizedSearch.length === 0 ||
    label.toLowerCase().includes(normalizedSearch);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <h2 className="text-sm font-semibold text-foreground">Node Library</h2>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
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

      <div className="flex-1 overflow-y-auto p-3">
        {CATEGORY_ORDER.map((category) => {
          const nodesInCategory = NODE_TYPES.filter(
            (nodeType) =>
              nodeType.category === category && matchesSearch(nodeType.label),
          );

          if (nodesInCategory.length === 0) {
            return null;
          }

          return (
            <div key={category} className="mb-5">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {CATEGORY_LABELS[category]}
              </p>

              <div className="grid grid-cols-2 gap-2">
                {nodesInCategory.map((nodeType) => (
                  <button
                    key={nodeType.kind}
                    type="button"
                    title={nodeType.description}
                    onClick={() => addNodeByKind(nodeType.kind)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-md",
                        CATEGORY_ICON_STYLES[category],
                      )}
                    >
                      <Icon name={nodeType.icon} className="size-3.5" />
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">
                      {nodeType.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
