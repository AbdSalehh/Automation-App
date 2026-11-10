import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { APP_NAME } from "@/shared/config/constants";
import { getAppUrl } from "@/shared/config/appUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = getAppUrl();
const appTitle = `${APP_NAME} — Workflow Automation`;
const appDescription =
  "Platform otomatisasi workflow — rancang, jalankan, dan pantau alur kerja agen Anda dalam satu tempat.";

/**
 * Metadata dasar untuk seluruh halaman. Gambar Open Graph dibuat oleh
 * `app/opengraph-image.tsx`, dan Next.js menambahkan tag gambarnya beserta
 * ukurannya secara otomatis, jadi tidak perlu ditulis ulang di sini.
 */
export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: appTitle,
    template: `%s | ${APP_NAME}`,
  },
  description: appDescription,
  applicationName: APP_NAME,
  keywords: [
    "workflow automation",
    "otomatisasi workflow",
    "WhatsApp automation",
    "no-code",
    APP_NAME,
  ],
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: appTitle,
    description: appDescription,
    url: "/",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
