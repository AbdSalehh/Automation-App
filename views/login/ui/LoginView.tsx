import Image from "next/image";
import { NetworkIcon, ShieldCheckIcon, Sparkles } from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { LoginConsentGate } from "@/features/user-auth";
import Link from "next/link";

const FEATURE_CARDS = [
  {
    iconColor: "bg-orange-100 text-orange-600",
    title: "Smart Automation",
    description: "Run repetitive tasks without manual effort",
  },
  {
    iconColor: "bg-purple-100 text-purple-600",
    title: "Secure & Trusted",
    description: "The security of your data is our priority",
  },
  {
    iconColor: "bg-emerald-100 text-emerald-600",
    title: "Scalable",
    description: "Built to grow together with your business",
  },
] as const;

const FEATURE_ICONS = [
  <svg key="zap" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>,
  <ShieldCheckIcon key="shield" className="size-4" />,
  <svg key="trend" viewBox="0 0 24 24" fill="currentColor" className="size-4">
    <path d="M3 17l6-6 4 4 8-8v4h-2V9.83l-6 6-4-4L4.41 18z" />
  </svg>,
] as const;

/**
 * Halaman login dengan tata letak dua kolom. Kolom kiri menampilkan banner
 * promosi dengan ilustrasi dan kartu fitur, kolom kanan berisi kartu form login.
 */
export function LoginView() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-7xl overflow-hidden bg-white">
      {/* Kolom kiri: banner promosi */}
      <div className="relative hidden w-[60%]! flex-col justify-between overflow-hidden bg-linear-to-br from-orange-50 via-white to-orange-50/40 p-10 lg:flex lg:flex-1 xl:p-14">
        <div className="z-10 flex max-w-xl flex-col items-start">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold tracking-wide text-orange-600">
            <Sparkles className="size-4" /> Automate. Simplify. Scale.
          </span>

          <h1 className="text-foreground text-4xl leading-[1.15] font-bold tracking-tight xl:text-5xl">
            Workflow automation made{" "}
            <span className="text-orange-500">simpler</span> &{" "}
            <span className="text-orange-500">smarter</span>
          </h1>

          <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
            {APP_NAME} helps you build, run, and manage automated workflows
            efficiently.
          </p>
        </div>
        <div className="absolute top-0 left-0 z-0 flex h-full w-full justify-center">
          <Image
            src="/login-illustration.webp"
            alt="Ilustrasi otomatisasi workflow"
            width={520}
            height={400}
            priority
            className="h-full! w-full! scale-120 object-contain"
          />
        </div>

        <div className="z-10 grid w-full grid-cols-3 gap-4">
          {FEATURE_CARDS.map((feature, index) => (
            <div
              key={feature.title}
              className="border-border/60 flex flex-col gap-2 rounded-xl border bg-white/80 p-4 shadow-sm backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-6 items-center justify-center rounded-lg ${feature.iconColor}`}
                >
                  {FEATURE_ICONS[index]}
                </div>
                <h4 className="text-foreground text-xs font-semibold">
                  {feature.title}
                </h4>
              </div>
              <div>
                <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kolom kanan: kartu login */}
      <div className="flex w-[40%]! flex-col items-center justify-center bg-white py-6 sm:py-12">
        <div className="flex w-full max-w-md flex-col">
          <div className="border-border bg-card flex w-full flex-col gap-7 rounded-xl border p-8 shadow-xl sm:p-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground text-2xl font-extrabold tracking-tight">
                Welcome back! 👋
              </h2>
              <p className="text-muted-foreground text-sm">
                Sign in to your {APP_NAME} account to continue.
              </p>
            </div>

            <LoginConsentGate />
          </div>

          <div className="mt-8 flex w-full justify-center">
            <span className="text-muted-foreground text-center text-xs">
              © 2026{" "}
              <Link
                href={ROUTES.home}
                className="font-semibold text-orange-500 hover:text-orange-600 hover:underline"
              >
                {APP_NAME}
              </Link>
              . All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
