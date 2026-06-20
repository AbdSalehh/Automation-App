"use client";

import { usePathname } from "next/navigation";

/**
 * Menyembunyikan child di halaman editor workflow (`/workflows/[id]`). Dipakai
 * agar navigasi, kotak pencarian, dan ikon notifikasi tidak tampil saat berada
 * di kanvas editor sehingga toolbar editor punya ruang penuh.
 */
export function HideOnEditor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isEditorPage = /^\/workflows\/[^/]+$/.test(pathname ?? "");

  if (isEditorPage) {
    return null;
  }

  return <>{children}</>;
}
