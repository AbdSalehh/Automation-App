import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/shared/lib/rateLimit";

/**
 * Middleware pembatas laju (rate limiting) berbasis Redis untuk meredam spam
 * refresh (GET), spam submit (mutasi), dan brute force pada halaman login.
 *
 * Memakai Node.js runtime (stabil di Next.js 16) agar bisa memakai redis client
 * `node-redis` yang sudah ada. Bersifat fail-open: bila Redis tidak tersedia,
 * permintaan tetap diteruskan.
 */

const TOO_MANY_REQUESTS = 429;

export async function middleware(request: NextRequest) {
  const clientIp = getClientIp(request);
  const { pathname } = request.nextUrl;
  const method = request.method;

  /** Brute force login: 5 percobaan POST per 60 detik per IP. */
  if (pathname.startsWith("/login") && method === "POST") {
    const loginLimit = await rateLimit(`login:${clientIp}`, 5, 60);

    if (!loginLimit.success) {
      return new NextResponse(
        "Terlalu banyak percobaan login. Coba lagi dalam satu menit.",
        { status: TOO_MANY_REQUESTS },
      );
    }
  }

  if (method === "GET") {
    const getLimit = await rateLimit(`get:${clientIp}`, 30, 10);

    if (!getLimit.success) {
      return new NextResponse("Terlalu banyak permintaan. Mohon tunggu.", {
        status: TOO_MANY_REQUESTS,
      });
    }
  } else if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const mutationLimit = await rateLimit(
      `mutation:${clientIp}:${pathname}`,
      5,
      10,
    );

    if (!mutationLimit.success) {
      return new NextResponse(
        "Terlalu banyak permintaan. Tunggu beberapa detik lalu coba lagi.",
        { status: TOO_MANY_REQUESTS },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    /**
     * Terapkan ke semua rute kecuali: aset statis Next.js, file gambar, webhook
     * publik (dipanggil layanan eksternal seperti Telegram), endpoint NextAuth
     * (`api/auth` di-poll sangat sering oleh klien sehingga membebani Redis),
     * dan cron internal. Mengecualikan ini mencegah ledakan koneksi Redis.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/auth|api/cron|.*\\.(?:webp|png|jpg|jpeg|svg|ico)$).*)",
  ],
};
