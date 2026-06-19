import { MotionSection } from "@/shared/ui";
import { LenisProvider } from "./LenisProvider";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingIntegrations } from "./LandingIntegrations";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";

/**
 * Landing page publik bertema terang/oranye. Dirakit dari sub-komponen per
 * bagian (header, hero, fitur, cara kerja, integrasi, CTA, footer) sesuai
 * aturan dekomposisi FSD. Pengguna yang sudah login diarahkan ke daftar
 * workflow oleh server (lihat app/page.tsx).
 */
export function LandingView() {
  return (
    <LenisProvider>
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <LandingHeader />

        <main className="flex-1">
          <LandingHero />

          <MotionSection>
            <LandingFeatures />
          </MotionSection>

          <MotionSection>
            <LandingHowItWorks />
          </MotionSection>

          <MotionSection>
            <LandingIntegrations />
          </MotionSection>

          <MotionSection>
            <LandingCta />
          </MotionSection>
        </main>

        <LandingFooter />
      </div>
    </LenisProvider>
  );
}
