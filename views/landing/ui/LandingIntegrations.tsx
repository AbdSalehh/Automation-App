import Link from "next/link";
import { ArrowRightIcon, ZapIcon } from "lucide-react";
import { ROUTES } from "@/shared/config/constants";
import { Button, BrandIcon } from "@/shared/ui";
import Image from "next/image";

/**
 * Bagian integrasi (gambar 4): panel oranye lembut dengan Fluxera di tengah
 * dikelilingi kartu logo brand, dihubungkan garis konektor putus-putus.
 */
export function LandingIntegrations() {
  return (
    <section id="integrasi" className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-orange-100 bg-orange-50/60 p-8 lg:grid-cols-2 lg:p-12">
        <div className="flex flex-col">
          <span className="mx-auto w-fit rounded-full bg-orange-100 px-3 py-1 text-xs font-bold tracking-widest text-orange-600 uppercase lg:mx-0">
            Integrasi Populer
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Terhubung dengan tools yang Anda gunakan
          </h2>
          <p className="mt-3 text-slate-600">
            Fluxera mendukung berbagai integrasi populer dan terus bertambah.
          </p>

          <Link href={ROUTES.login} className="mt-6">
            <Button className="gap-2 bg-orange-500 px-6 text-white hover:bg-orange-600">
              Lihat Semua Integrasi
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
        </div>

        <Image
          src="/illustrations.webp"
          alt="Integrations"
          width={500}
          height={500}
          className="h-full! w-full! object-contain"
        />
      </div>
    </section>
  );
}
