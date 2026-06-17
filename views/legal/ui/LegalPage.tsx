import Link from "next/link";
import { ZapIcon, ArrowLeftIcon } from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";

interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

/**
 * Layout bersama untuk halaman legal (Syarat Layanan & Privasi) dengan header
 * ringkas, tautan kembali ke beranda, dan tipografi yang mudah dibaca.
 */
export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-indigo-500 to-fuchsia-500 text-white">
              <ZapIcon className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>

          <Link
            href={ROUTES.home}
            className="flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="size-4" />
            Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Terakhir diperbarui: {lastUpdated}
        </p>

        <p className="mt-8 leading-relaxed text-slate-300">{intro}</p>

        <div className="mt-10 flex flex-col gap-8">
          {sections.map((section, sectionIndex) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-white">
                {sectionIndex + 1}. {section.heading}
              </h2>

              <div className="mt-3 flex flex-col gap-3">
                {section.body.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className="leading-relaxed text-slate-300"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME}
        </div>
      </footer>
    </div>
  );
}
