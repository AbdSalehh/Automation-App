import { APP_NAME } from "@/shared/config/constants";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { CredentialsLoginForm, LoginButton } from "@/features/user-auth";
import { LoginBrandPanel } from "./LoginBrandPanel";

/**
 * Halaman login berbentuk satu kartu dua kolom. Kolom kiri berisi panel merek
 * dengan latar gradien animasi, kolom kanan berisi form login email/password
 * dan tombol Google.
 */
export function LoginView() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-100 p-4 font-sans lg:p-8">
      <div className="short:min-h-0 flex w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white p-3 shadow-2xl lg:min-h-160 lg:max-w-5xl">
        <LoginBrandPanel />

        <div className="short:p-5 flex w-full flex-col justify-between bg-white p-6 text-neutral-900 sm:p-8 lg:w-1/2 lg:p-12 lg:pt-4">
          <div className="flex items-center justify-center">
            <BrandLogo size={24} textClassName="text-sm text-neutral-900" />
          </div>

          <div className="short:py-3 short:pt-4 mx-auto my-auto w-full max-w-sm py-6 pt-8 lg:pt-12">
            <div className="short:mb-5 mb-8 text-center">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Welcome back!
              </h2>
              <p className="mt-2 text-xs text-neutral-500">
                Sign in to your {APP_NAME} account to continue.
              </p>
            </div>

            <div className="short:gap-3 flex flex-col gap-5">
              <CredentialsLoginForm />

              <div className="flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs font-medium text-neutral-400">
                  or continue with
                </span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>

              <LoginButton />
            </div>
          </div>

          <p className="short:hidden text-center text-xs text-neutral-400">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
