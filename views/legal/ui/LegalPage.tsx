import Link from "next/link";
import Image from "next/image";
import {
  NetworkIcon,
  DownloadIcon,
  ChevronDownIcon,
  CalendarIcon,
  MailIcon,
} from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/widgets/app-header";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/ui/accordion";

export interface LegalSection {
  heading: string;
  body: string[];
  icon?: React.ReactNode;
  iconClassName?: string;
}

export interface LegalSummaryCard {
  icon: React.ReactNode;
  iconClassName?: string;
  title: string;
  text: string;
}

export interface LegalPageProps {
  type: "privacy" | "terms";
  title: string;
  cardTitle: string;
  cardDescription: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  summaryTitle: string;
  summarySubtitle: string;
  summaryCards: LegalSummaryCard[];
  callToAction?: React.ReactNode;
}

/**
 * Layout bersama untuk halaman legal (Syarat Layanan & Privasi).
 * Privasi memakai daftar accordion dengan ikon berwarna, sedangkan Syarat
 * Layanan memakai tata letak dua kolom (nomor + judul di kiri, isi di kanan).
 */
export function LegalPage({
  type,
  title,
  cardTitle,
  cardDescription,
  lastUpdated,
  intro,
  sections,
  summaryTitle,
  summarySubtitle,
  summaryCards,
  callToAction,
}: LegalPageProps) {
  const illustration = type === "privacy" ? "/privacy.webp" : "/terms.webp";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60">
      <AppHeader />

      <main className="mx-auto w-full flex-1 pb-16">
        {/* Banner */}
        <div className="relative overflow-hidden">
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 py-12 md:flex-row">
            <div className="flex max-w-xl flex-1 flex-col gap-4">
              <span className="flex w-fit items-center gap-1.5 rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-orange-600 uppercase">
                <NetworkIcon className="size-3" />
                Legal
              </span>

              <h1 className="text-foreground text-4xl font-bold tracking-tight md:text-5xl">
                {title}
              </h1>

              <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                {intro}
              </p>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <CalendarIcon className="size-4" />
                Terakhir diperbarui: {lastUpdated}
              </div>
            </div>

            <div className="absolute -top-10 right-0 flex flex-1 justify-center md:justify-end">
              <Image
                src={illustration}
                alt={`Ilustrasi ${title}`}
                width={460}
                height={320}
                priority
                className="h-auto w-full max-w-xl! object-contain"
              />
            </div>
          </div>
        </div>

        {/* Konten utama */}
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4">
          <div className="bg-background border-border overflow-hidden rounded-2xl border shadow-sm">
            {type === "privacy" && (
              <div className="border-border flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold">{cardTitle}</h2>
                  <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                    {cardDescription}
                  </p>
                </div>

                <button className="border-border hover:bg-muted flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors">
                  <DownloadIcon className="size-4" />
                  Unduh Kebijakan
                </button>
              </div>
            )}

            {/* Privasi: accordion */}
            {type === "privacy" ? (
              <div className="p-4 sm:p-6">
                <Accordion
                  type="single"
                  collapsible
                  className="flex flex-col gap-3"
                >
                  {sections.map((section, index) => {
                    const numStr = (index + 1).toString().padStart(2, "0");
                    return (
                      <AccordionItem
                        key={section.heading}
                        value={section.heading}
                        className="border-border bg-card rounded-xl border last:border-b"
                      >
                        <AccordionTrigger className="gap-4 px-4 py-4 hover:no-underline">
                          <div className="flex flex-1 items-center gap-4 text-left">
                            <div
                              className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${section.iconClassName ?? "bg-orange-50 text-orange-600"}`}
                            >
                              {section.icon}
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-orange-500">
                                  {numStr}
                                </span>
                                <h3 className="text-foreground text-base font-semibold!">
                                  {section.heading}
                                </h3>
                              </div>
                              <p className="text-muted-foreground text-xs leading-relaxed">
                                {section.body[0]}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-4 pl-20">
                          <div className="flex flex-col gap-3">
                            {section.body.map((paragraph, pIndex) => (
                              <p
                                key={pIndex}
                                className="text-muted-foreground text-sm leading-relaxed"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ) : (
              /* Syarat Layanan: dua kolom */
              <div className="flex flex-col p-2 sm:p-4">
                {sections.map((section, index) => {
                  const numStr = (index + 1).toString().padStart(2, "0");
                  return (
                    <div
                      key={section.heading}
                      className="border-border grid gap-4 border-b px-4 py-6 last:border-b-0 sm:grid-cols-[260px_1fr] sm:gap-8 sm:px-6"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-500">
                          {numStr}
                        </span>
                        <h3 className="text-foreground text-base font-semibold!">
                          {section.heading}
                        </h3>
                      </div>

                      <div className="flex flex-col gap-3">
                        {section.body.map((paragraph, pIndex) => (
                          <p
                            key={pIndex}
                            className="text-muted-foreground text-sm leading-relaxed"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ringkasan */}
          <div className="bg-background border-border rounded-2xl border p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold">{summaryTitle}</h3>
            <p className="text-muted-foreground mt-1 mb-8 text-sm">
              {summarySubtitle}
            </p>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {summaryCards.map((card, index) => (
                <div key={index} className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex size-8 items-center justify-center rounded-xl ${card.iconClassName ?? "bg-orange-50 text-orange-600"}`}
                    >
                      {card.icon}
                    </div>
                    <span className="text-sm font-bold">{card.title}</span>
                  </div>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    {card.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {callToAction}
        </div>
      </main>

      <LegalFooter type={type} />
    </div>
  );
}

/**
 * Footer besar untuk halaman legal dengan peta situs produk dan tautan legal.
 */
function LegalFooter({ type }: { type: "privacy" | "terms" }) {
  const columns = [
    {
      title: "Produk",
      links: [
        { label: "Dashboard", href: ROUTES.dashboard },
        { label: "Workflows", href: ROUTES.workflows },
        { label: "Credentials", href: ROUTES.credentials },
        { label: "Integrations", href: "#" },
      ],
    },
    {
      title: "Sumber Daya",
      links: [
        { label: "Dokumentasi", href: "#" },
        { label: "Tutorial", href: "#" },
        { label: "Blog", href: "#" },
        { label: "API Reference", href: "#" },
      ],
    },
    {
      title: "Perusahaan",
      links: [
        { label: "Tentang Kami", href: "#" },
        { label: "Karir", href: "#" },
        { label: "Kontak", href: "#" },
        { label: "Status", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-border bg-background border-t pt-12 pb-8">
      <div className="border-border mx-auto flex max-w-6xl flex-col justify-between gap-12 border-b px-4 pb-12 md:flex-row">
        <div className="flex max-w-xs flex-col gap-4">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <NetworkIcon className="size-6 text-orange-500" />
            <span className="text-xl font-extrabold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-slate-500">
            Platform otomasi workflow visual yang aman, andal, dan mudah
            digunakan.
          </p>
          <div className="mt-2 flex items-center gap-4 text-slate-400">
            <MailIcon className="size-5 cursor-pointer transition-colors hover:text-slate-600" />
          </div>
        </div>

        <div className="flex flex-wrap gap-12 sm:gap-16">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-4">
              <span className="text-sm font-bold">{column.title}</span>
              <div className="flex flex-col gap-3 text-sm text-slate-500">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="transition-colors hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold">Legal</span>
            <div className="flex flex-col gap-3 text-sm text-slate-500">
              <Link
                href={ROUTES.terms}
                className={cn(
                  "transition-colors",
                  type === "terms"
                    ? "text-orange-500 hover:text-orange-600"
                    : "hover:text-slate-900",
                )}
              >
                Terms of Service
              </Link>
              <Link
                href={ROUTES.privacy}
                className={cn(
                  "transition-colors",
                  type === "privacy"
                    ? "text-orange-500 hover:text-orange-600"
                    : "hover:text-slate-900",
                )}
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {APP_NAME}. Semua hak dilindungi.
      </div>
    </footer>
  );
}
