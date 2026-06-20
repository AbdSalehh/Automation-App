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
 * aturan dekomposisi FSD. Halaman ini tetap dapat diakses meski pengguna sudah
 * login; status login diteruskan ke header untuk menyesuaikan tombol aksi.
 */
export function LandingView({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  return (
    <LenisProvider>
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <LandingHeader isAuthenticated={isAuthenticated} />

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
