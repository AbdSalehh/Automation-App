import Link from "next/link";
import { ROUTES } from "@/shared/config/constants";
import { Button, BrandLogo } from "@/shared/ui";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Integrasi", href: "#integrasi" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Dokumentasi", href: ROUTES.terms },
];

/**
 * Header landing page bertema terang. Memuat logo Fluxera, navigasi anchor,
 * serta tombol aksi. Untuk pengguna yang sudah login ditampilkan tombol menuju
 * dashboard, selain itu tombol Login dan Login dengan Google (aksen oranye).
 */
export function LandingHeader({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-100/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5">
        <BrandLogo size={36} textClassName="text-lg text-slate-900" />

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
          {isAuthenticated ? (
            <Link href={ROUTES.workflows} id="header-dashboard-button">
              <Button className="bg-orange-500 text-white shadow-sm hover:bg-orange-600">
                Buka Dashboard
              </Button>
            </Link>
          ) : (
            <>
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
            </>
          )}
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
