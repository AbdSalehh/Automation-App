import Image from "next/image";
import { cn } from "@/shared/lib/utils";

/** Brand yang punya berkas SVG di `public/icons`. */
export type BrandIconName =
  | "whatsapp"
  | "telegram"
  | "gmail"
  | "google-sheets"
  | "google-calendar"
  | "gemini"
  | "google-drive";

const BRAND_LABELS: Record<BrandIconName, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  gmail: "Gmail",
  "google-sheets": "Google Sheets",
  "google-calendar": "Google Calendar",
  "google-drive": "Google Drive",
  gemini: "Gemini",
};

interface BrandIconProps {
  name: BrandIconName;
  className?: string;
}

/**
 * Merender ikon brand resmi dari `public/icons` sebagai gambar SVG. Dipakai di
 * palette, kartu node, dan landing untuk logo layanan (WhatsApp, Gmail, dll.).
 */
export function BrandIcon({ name, className }: BrandIconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt={BRAND_LABELS[name]}
      width={20}
      height={20}
      className={cn("size-4 object-contain", className)}
    />
  );
}
