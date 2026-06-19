import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { Button } from "@/shared/ui";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Integrasi", href: "#integrasi" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Dokumentasi", href: ROUTES.terms },
];

/**
 * Header landing page bertema terang. Memuat logo Fluxera, navigasi anchor,
 * serta tombol Login biasa dan Login dengan Google (aksen oranye).
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-100/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30">
            <ZapIcon className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            {APP_NAME}
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {NAV_LINKS.map((navLink) => (
            <a
              key={navLink.label}
              href={navLink.href}
              className="transition-colors hover:text-orange-600"
            >
              {navLink.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={ROUTES.login} id="header-login-button">
            <Button
              variant="ghost"
              className="text-slate-700 hover:bg-orange-50 hover:text-orange-600"
            >
              Login
            </Button>
          </Link>

          <Link href={ROUTES.login} id="header-google-login-button">
            <Button className="gap-2 bg-orange-500 text-white shadow-sm hover:bg-orange-600">
              <GoogleGlyph />
              Login dengan Google
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Glyph "G" Google sederhana untuk tombol login. */
function GoogleGlyph() {
  return (
    <span className="grid size-4 place-items-center rounded-full bg-white text-[10px] font-bold text-orange-600">
      G
    </span>
  );
}
