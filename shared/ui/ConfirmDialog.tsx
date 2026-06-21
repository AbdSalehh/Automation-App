"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import type { Button } from "@/shared/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Varian tombol konfirmasi; "destructive" untuk aksi hapus. */
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  /** Nonaktifkan tombol konfirmasi (mis. saat proses sedang berjalan). */
  isConfirming?: boolean;
  onConfirm: () => void;
}

/**
 * Dialog konfirmasi siap pakai untuk aksi berbahaya (hapus, dsb.). Membungkus
 * primitif alert-dialog agar pemanggilan di seluruh aplikasi konsisten dan
 * ringkas. Tombol konfirmasi tidak otomatis menutup dialog supaya pemanggil
 * bisa menutupnya setelah proses async selesai.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  confirmVariant = "destructive",
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>

          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            {cancelLabel}
          </AlertDialogCancel>

          <AlertDialogAction
            variant={confirmVariant}
            disabled={isConfirming}
            onClick={(clickEvent) => {
              clickEvent.preventDefault();
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
