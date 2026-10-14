import type { NextConfig } from "next";

/**
 * Origin penyimpanan media WhatsApp selain Cloudinary, mis. domain publik
 * bucket Cloudflare R2 (`https://media.domainanda.com` atau
 * `https://pub-xxxx.r2.dev`). Dibaca saat build; kosongkan bila masih memakai
 * Cloudinary saja.
 */
const mediaStorageOrigin = (() => {
  const rawUrl = process.env.MEDIA_STORAGE_PUBLIC_URL?.trim();

  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
})();

/**
 * Sumber media yang diizinkan diputar (video/audio). Cloudinary tetap
 * diizinkan agar media lama masih bisa diputar selama masa transisi.
 */
const mediaSources = [
  "'self'",
  "blob:",
  "https://res.cloudinary.com",
  ...(mediaStorageOrigin ? [mediaStorageOrigin] : []),
].join(" ");

/**
 * Content-Security-Policy yang aman namun tetap mengizinkan layanan yang
 * dipakai aplikasi: Ably (realtime), Google OAuth/avatar, gambar data/blob,
 * serta inline-style yang dibutuhkan Tailwind/Next. Bersifat permisif pada
 * `connect-src` untuk websocket Ably.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `media-src ${mediaSources}`,
  "font-src 'self' data:",
  "connect-src 'self' https://*.ably.io wss://*.ably.io https://*.ably.net wss://*.ably.net https://*.ably-realtime.com wss://*.ably-realtime.com https://accounts.google.com",
  "frame-src 'self' https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * Header keamanan standar untuk seluruh respons. Mengurangi risiko XSS,
 * clickjacking, MIME-sniffing, dan kebocoran referrer.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/**
 * Alamat bucket R2 yang dilewatkan lewat domain situs sendiri. Bila diisi,
 * `https://domain-situs/media/...` diteruskan ke bucket. Berguna saat alamat
 * `r2.dev` diblokir operator internet (mis. di Indonesia): browser hanya
 * melihat domain situs, yang tidak diblokir. Kosongkan bila memakai domain
 * kustom di Cloudflare atau Cloudinary.
 */
const mediaProxyTarget = (() => {
  const rawUrl = process.env.MEDIA_PROXY_TARGET?.trim();

  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  async rewrites() {
    if (!mediaProxyTarget) {
      return [];
    }

    return [
      {
        source: "/media/:path*",
        destination: `${mediaProxyTarget}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      ...(mediaStorageOrigin
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(mediaStorageOrigin).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
