import { ImageResponse } from "next/og";
import { BrandMark } from "@/shared/ui/BrandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Ikon layar utama iOS. Memakai warna primer dalam hex karena `next/og` tidak
 * mendukung format `oklch` dan kelas Tailwind.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#df5101",
      }}
    >
      <BrandMark size={180} tileColor="#df5101" glyphColor="#ffffff" />
    </div>,
    size,
  );
}
