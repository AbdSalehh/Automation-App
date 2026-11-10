import { MONOGRAM, WORDMARK } from "@/shared/config/brandPaths";
import { cn } from "@/shared/lib/utils";

interface BrandWordmarkProps {
  /** Tinggi logo dalam piksel. Lebarnya mengikuti rasio bawaan. */
  height?: number;
  /**
   * Warna huruf dan titik dalam hex. Hanya diisi di tempat yang tidak bisa
   * memakai kelas Tailwind, yaitu gambar OG yang dirender `next/og`. Bila
   * kosong, huruf mengikuti warna teks sekitarnya dan titik memakai `primary`.
   */
  letterColor?: string;
  dotColor?: string;
  className?: string;
}

/**
 * Logo Fyber berupa tulisan "fyber" dengan titik berwarna primer. Berupa path
 * SVG sehingga tampil sama di mana pun tanpa bergantung pada font.
 */
export function BrandWordmark({
  height = 24,
  letterColor,
  dotColor,
  className,
}: BrandWordmarkProps) {
  const letterProps = letterColor
    ? { fill: letterColor }
    : { className: "fill-current" };
  const dotProps = dotColor ? { fill: dotColor } : { className: "fill-primary" };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      width={(height * WORDMARK.width) / WORDMARK.height}
      height={height}
      role="img"
      aria-label="Fyber"
      className={cn("shrink-0", className)}
    >
      <path d={WORDMARK.letters} {...letterProps} />
      <path d={WORDMARK.dot} {...dotProps} />
    </svg>
  );
}

interface BrandMarkProps {
  /** Ukuran sisi ikon dalam piksel. */
  size?: number;
  /** Warna latar dan huruf dalam hex untuk `next/og`. Kosong berarti tema. */
  tileColor?: string;
  glyphColor?: string;
  className?: string;
}

/** Skala dan posisi monogram agar berada di tengah tile 64 x 64. */
const MONOGRAM_SCALE = 32 / MONOGRAM.height;
const MONOGRAM_OFFSET_X = 32 - (MONOGRAM.width * MONOGRAM_SCALE) / 2;
const MONOGRAM_OFFSET_Y = 16;

/**
 * Ikon persegi "f." untuk ruang yang tidak muat logo tulisan, seperti favicon
 * dan ikon layar utama iOS.
 */
export function BrandMark({
  size = 32,
  tileColor,
  glyphColor,
  className,
}: BrandMarkProps) {
  const tileProps = tileColor
    ? { fill: tileColor }
    : { className: "fill-primary" };
  const glyphProps = glyphColor
    ? { fill: glyphColor }
    : { className: "fill-primary-foreground" };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Fyber"
      className={cn("shrink-0", className)}
    >
      <rect width="64" height="64" rx="16" {...tileProps} />

      <g
        transform={`translate(${MONOGRAM_OFFSET_X} ${MONOGRAM_OFFSET_Y}) scale(${MONOGRAM_SCALE})`}
        {...glyphProps}
      >
        <path d={MONOGRAM.letter} />
        <path d={MONOGRAM.dot} />
      </g>
    </svg>
  );
}
