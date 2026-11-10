import { cn } from "@/shared/lib/utils";
import { BrandWordmark } from "./BrandMark";

/** Perbandingan tinggi tulisan terhadap `size` agar sepadan dengan teks sekitar. */
const WORDMARK_HEIGHT_RATIO = 0.75;

interface BrandLogoProps {
  /** Ukuran acuan logo dalam piksel. Default 32. */
  size?: number;
  /** Kelas tambahan untuk warna huruf logo, mis. `text-slate-900`. */
  textClassName?: string;
  className?: string;
}

/**
 * Logo brand Fyber berupa tulisan "fyber." dengan titik berwarna primer.
 * Dipakai lintas header, footer, dan dashboard agar identitas visual
 * konsisten. Warna huruf mengikuti `textClassName` atau teks sekitarnya.
 */
export function BrandLogo({
  size = 32,
  textClassName,
  className,
}: BrandLogoProps) {
  return (
    <span className={cn("flex items-center", textClassName, className)}>
      <BrandWordmark height={Math.round(size * WORDMARK_HEIGHT_RATIO)} />
    </span>
  );
}
