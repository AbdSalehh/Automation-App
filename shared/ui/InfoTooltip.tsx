"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface InfoTooltipProps {
  /** Isi penjelasan. Boleh berisi elemen inline seperti `<code>`. */
  content: React.ReactNode;
  /** Label aksesibel untuk tombol ikon, dibacakan oleh pembaca layar. */
  label?: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * Ikon info kecil yang menampilkan penjelasan saat diarahkan atau difokus.
 * Dipakai untuk teks bantuan yang tidak perlu selalu terlihat, agar panel
 * tetap ringkas. Ikonnya berupa tombol sehingga bisa dijangkau dengan
 * keyboard. Lebar tooltip dibatasi supaya teks panjang tetap terbaca.
 */
export function InfoTooltip({
  content,
  label = "More information",
  side = "top",
  className,
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "text-muted-foreground/70 hover:text-foreground focus-visible:ring-ring/50 inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2",
            className,
          )}
        >
          <InfoIcon className="size-3.5" />
        </button>
      </TooltipTrigger>

      <TooltipContent
        side={side}
        className="max-w-64 text-left leading-relaxed text-pretty"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
