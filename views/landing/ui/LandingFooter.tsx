import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";

const FOOTER_COLUMNS = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "#fitur" },
      { label: "Integrasi", href: "#integrasi" },
      { label: "Cara Kerja", href: "#cara-kerja" },
    ],
  },
  {
    title: "Sumber Daya",
    links: [
      { label: "Dokumentasi", href: ROUTES.terms },
      { label: "Blog", href: ROUTES.terms },
      { label: "API Reference", href: ROUTES.terms },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Syarat Layanan", href: ROUTES.terms },
      { label: "Kebijakan Privasi", href: ROUTES.privacy },
    ],
  },
];

/** Footer multi-kolom bertema terang dengan ringkasan brand dan tautan. */
export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-orange-500 to-amber-500 text-white">
              <ZapIcon className="size-4" />
            </span>
            <span className="text-base font-bold text-slate-900">
              {APP_NAME}
            </span>
          </div>
          <p className="max-w-xs text-sm text-slate-500">
            Platform workflow automation berbasis visual node, mudah digunakan
            dan andal.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {column.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-orange-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
