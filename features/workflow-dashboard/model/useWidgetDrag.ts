"use client";

import { useCallback, useRef, useState } from "react";

interface DragState {
  mode: "move" | "resize";
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface UseWidgetDragParams {
  x: number;
  y: number;
  width: number;
  height: number;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
}

export function useWidgetDrag({
  x,
  y,
  width,
  height,
  onMove,
  onResize,
}: UseWidgetDragParams) {
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback(
    (pointerEvent: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const deltaX = pointerEvent.clientX - dragState.startPointerX;
      const deltaY = pointerEvent.clientY - dragState.startPointerY;

      if (dragState.mode === "resize") {
        onResize(
          Math.max(180, dragState.startWidth + deltaX),
          Math.max(120, dragState.startHeight + deltaY),
        );

        return;
      }

      onMove(
        Math.max(0, dragState.startX + deltaX),
        Math.max(0, dragState.startY + deltaY),
      );
    },
    [onMove, onResize],
  );

  const stopDragging = useCallback(() => {
    dragStateRef.current = null;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
  }, [handlePointerMove]);

  const startDragging = useCallback(
    (pointerEvent: React.PointerEvent, mode: DragState["mode"]) => {
      pointerEvent.preventDefault();
      pointerEvent.stopPropagation();

      dragStateRef.current = {
        mode,
        startPointerX: pointerEvent.clientX,
        startPointerY: pointerEvent.clientY,
        startX: x,
        startY: y,
        startWidth: width,
        startHeight: height,
      };

      setIsDragging(true);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopDragging);
    },
    [handlePointerMove, height, stopDragging, width, x, y],
  );

  return { isDragging, startDragging };
}
