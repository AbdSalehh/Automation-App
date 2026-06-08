import { ZapIcon } from "lucide-react";
import { APP_NAME } from "@/shared/config/constants";
import { OnboardingForm } from "@/features/user-onboarding";

interface OnboardingViewProps {
  userName: string | null;
}

export function OnboardingView({ userName }: OnboardingViewProps) {
  const displayName = userName?.split(" ")[0] ?? "kamu";

  return (
    <div className="grid flex-1 place-items-center bg-muted/40 px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ZapIcon className="size-5" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-foreground">
              Selamat datang, {displayName}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Bantu kami mengenal kamu sebelum mulai di {APP_NAME}.
            </p>
          </div>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
