import { ZapIcon } from "lucide-react";
import { APP_NAME } from "@/shared/config/constants";
import { LoginButton, CredentialsLoginForm } from "@/features/user-auth";

export function LoginView() {
  return (
    <div className="grid flex-1 place-items-center bg-muted/40 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ZapIcon className="size-7" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform workflow automation. Masuk untuk mulai membangun automasi.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <CredentialsLoginForm />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">atau</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <LoginButton />
        </div>
      </div>
    </div>
  );
}
