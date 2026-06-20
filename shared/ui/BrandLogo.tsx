import Image from "next/image";
import { APP_NAME } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";

interface BrandLogoProps {
  /** Ukuran sisi logo dalam piksel. Default 32. */
  size?: number;
  /** Sembunyikan teks nama brand bila hanya ingin menampilkan ikon. */
  hideText?: boolean;
  /** Kelas tambahan untuk teks nama brand. */
  textClassName?: string;
  className?: string;
}

/**
 * Logo brand Fluxera memakai berkas resmi `public/logo.webp`. Dipakai lintas
 * header, footer, dan dashboard agar identitas visual konsisten.
 */
export function BrandLogo({
  size = 32,
  hideText = false,
  textClassName,
  className,
}: BrandLogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.webp"
        alt={`Logo ${APP_NAME}`}
        width={size}
        height={size}
        className="rounded-lg object-contain"
        priority
      />

      {!hideText && (
        <span className={cn("font-bold tracking-tight", textClassName)}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
