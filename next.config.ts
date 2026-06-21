import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
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
