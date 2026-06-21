"use client";

import { Panel, useReactFlow, useStore } from "@xyflow/react";
import {
  MapIcon,
  MaximizeIcon,
  BracesIcon,
  ZoomInIcon,
  ZoomOutIcon,
  SaveIcon,
  DownloadIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button, Spinner, SimpleTooltip } from "@/shared/ui";
import { useWorkflowStore } from "@/entities/workflow";
import { exportWorkflow } from "@/widgets/workflow-list";

interface CanvasControlsProps {
  isMiniMapVisible: boolean;
  showControls: boolean;
  onToggleMiniMap: () => void;
  onShowJson: () => void;
  onOpenSettings: () => void;
}

/**
 * Kontrol kanvas kustom mengikuti desain editor: grup alat di kiri bawah
 * (toggle minimap, fit-view, lihat JSON, ekspor) dan grup kanan bawah berisi
 * tombol Simpan + kendali zoom. Versi workflow hanya naik saat Simpan ditekan.
 */
export function CanvasControls({
  isMiniMapVisible,
  showControls,
  onToggleMiniMap,
  onShowJson,
  onOpenSettings,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const zoomLevel = useStore((state) => state.transform[2]);
  const zoomPercent = Math.round(zoomLevel * 100);

  const { name, nodes, edges, isDirty, isSaving, saveWorkflow } =
    useWorkflowStore();

  const handleExport = () => {
    exportWorkflow({ name, nodes, edges });
  };

  return (
    <>
      <Panel position="bottom-left">
        <div className="border-border bg-card/90 flex items-center gap-1 rounded-xl border p-1 shadow-lg backdrop-blur">
          <ControlButton
            label="Toggle minimap"
            isActive={isMiniMapVisible}
            onClick={onToggleMiniMap}
          >
            <MapIcon className="size-4" />
          </ControlButton>

          <ControlButton
            label="Fit view"
            onClick={() => fitView({ duration: 300 })}
          >
            <MaximizeIcon className="size-4" />
          </ControlButton>

          <ControlButton label="Lihat JSON" onClick={onShowJson}>
            <BracesIcon className="size-4" />
          </ControlButton>

          <ControlButton label="Ekspor workflow" onClick={handleExport}>
            <DownloadIcon className="size-4" />
          </ControlButton>

          <ControlButton label="Setelan editor" onClick={onOpenSettings}>
            <SettingsIcon className="size-4" />
          </ControlButton>
        </div>
      </Panel>

      <Panel position="bottom-right">
        <div className="flex items-center gap-2">
          <Button
            variant={isDirty ? "default" : "outline"}
            size="sm"
            onClick={saveWorkflow}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? <Spinner /> : <SaveIcon className="size-4" />}
            {isSaving ? "Menyimpan…" : isDirty ? "Simpan" : "Tersimpan"}
          </Button>

          {showControls && (
            <div className="border-border bg-card/90 flex items-center gap-0.5 rounded-xl border p-1 shadow-lg backdrop-blur">
              <ControlButton
                label="Perkecil"
                onClick={() => zoomOut({ duration: 200 })}
              >
                <ZoomOutIcon className="size-4" />
              </ControlButton>

              <button
                type="button"
                onClick={() => fitView({ duration: 300 })}
                className="text-foreground hover:bg-muted min-w-12 rounded-lg px-2 py-1.5 text-xs font-semibold tabular-nums transition-colors"
              >
                {zoomPercent}%
              </button>

              <ControlButton
                label="Perbesar"
                onClick={() => zoomIn({ duration: 200 })}
              >
                <ZoomInIcon className="size-4" />
              </ControlButton>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}

interface ControlButtonProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ControlButton({
  label,
  isActive,
  onClick,
  children,
}: ControlButtonProps) {
  return (
    <SimpleTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          "text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors",
          isActive && "bg-primary/10 text-primary",
        )}
      >
        {children}
      </button>
    </SimpleTooltip>
  );
}
