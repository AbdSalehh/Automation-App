"use client";

import { ReactNode, useEffect } from "react";
import { XIcon } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="border-border bg-card flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-xl"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        {title && (
          <div className="border-border flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-foreground text-lg font-semibold">{title}</h2>

            <button
              onClick={onClose}
              aria-label="Tutup"
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-1"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="border-border flex justify-end gap-2 border-t px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
