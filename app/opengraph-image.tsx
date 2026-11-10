import { ImageResponse } from "next/og";
import { APP_NAME } from "@/shared/config/constants";

export const alt = `${APP_NAME} — Workflow automation made simpler & smarter`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Warna primer aplikasi (`--primary` di globals.css) dalam hex, karena
 * pembuat gambar `next/og` tidak mendukung format `oklch`.
 */
const PRIMARY_COLOR = "#df5101";

/**
 * Gambar pratinjau tautan (Open Graph) yang tampil saat alamat aplikasi
 * dibagikan di WhatsApp, Telegram, atau media sosial.
 *
 * `ImageResponse` merender JSX menjadi PNG di server, bukan ke DOM, sehingga
 * Tailwind tidak tersedia dan gaya wajib ditulis sebagai objek `style`.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: "#0c0a09",
        backgroundImage: `radial-gradient(circle at 85% 20%, ${PRIMARY_COLOR} 0%, rgba(223, 81, 1, 0.35) 30%, rgba(12, 10, 9, 0) 62%)`,
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: PRIMARY_COLOR,
          }}
        />
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
          {APP_NAME}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          Automate. Simplify. Scale.
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          Workflow automation made simpler & smarter
        </div>
      </div>
    </div>,
    size,
  );
}
