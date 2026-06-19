"use client";

import { Panel, useReactFlow, useStore } from "@xyflow/react";
import {
  MapIcon,
  MaximizeIcon,
  BracesIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface CanvasControlsProps {
  isMiniMapVisible: boolean;
  onToggleMiniMap: () => void;
  onShowJson: () => void;
}

/**
 * Custom React Flow controls matching the editor design: a rounded tool group
 * at the bottom-left (minimap toggle, fit-view, JSON) and a zoom pill at the
 * bottom-right.
 */
export function CanvasControls({
  isMiniMapVisible,
  onToggleMiniMap,
  onShowJson,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const zoomLevel = useStore((state) => state.transform[2]);
  const zoomPercent = Math.round(zoomLevel * 100);

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
        </div>
      </Panel>

      <Panel position="bottom-right">
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
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors",
        isActive && "bg-primary/10 text-primary",
      )}
    >
      {children}
    </button>
  );
}
