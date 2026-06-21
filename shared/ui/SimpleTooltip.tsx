"use client";

import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

interface SimpleTooltipProps {
  /** Teks yang ditampilkan di dalam tooltip. */
  label: React.ReactNode;
  /** Elemen pemicu; di-render sebagai trigger (asChild) tanpa membungkus DOM tambahan. */
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Pembungkus ringkas untuk Tooltip Radix agar pemakaian di seluruh aplikasi
 * konsisten dan menggantikan atribut `title` bawaan. Membutuhkan `TooltipProvider`
 * di pohon ancestor (dipasang global di `app/providers.tsx`).
 */
export function SimpleTooltip({ label, children, side }: SimpleTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
