import Link from "next/link";
import { ArrowRightIcon, PlayIcon } from "lucide-react";
import { ROUTES } from "@/shared/config/constants";
import { Button } from "@/shared/ui";

/** Banner CTA penutup dengan latar gradien oranye penuh. */
export function LandingCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-500 to-amber-500/50 px-8 py-10 text-center shadow-xl shadow-orange-500/30">
        <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-white/10 blur-2xl" />

        <h2 className="relative text-3xl font-bold tracking-tight text-white md:text-4xl">
          Siap mengotomatiskan workflow Anda?
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-orange-50">
          Bergabunglah dan rasakan betul efisiensi membangun otomasi bisnis
          tanpa coding bersama Fluxera.
        </p>

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={ROUTES.login}>
            <Button
              size="lg"
              className="gap-2 bg-white px-8 text-orange-600 hover:bg-orange-50"
            >
              Mulai Gratis Sekarang
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>

          <a href="#cara-kerja">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-white/40 bg-transparent px-8 text-white hover:bg-white/10"
            >
              <PlayIcon className="size-4" />
              Lihat Demo
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
