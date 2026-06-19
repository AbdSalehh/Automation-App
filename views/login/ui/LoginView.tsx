import { ZapIcon } from "lucide-react";
import { APP_NAME } from "@/shared/config/constants";
import { LoginButton, CredentialsLoginForm } from "@/features/user-auth";

export function LoginView() {
  return (
    <div className="bg-muted/40 grid flex-1 place-items-center px-4">
      <div className="border-border bg-card flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border p-10 text-center shadow-sm">
        <div className="bg-primary text-primary-foreground grid size-14 place-items-center rounded-xl">
          <ZapIcon className="size-7" />
        </div>

        <div>
          <h1 className="text-foreground text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Platform workflow automation. Masuk untuk mulai membangun automasi.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <CredentialsLoginForm />

          <div className="flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">atau</span>
            <div className="bg-border h-px flex-1" />
          </div>

          <LoginButton />
        </div>
      </div>
    </div>
  );
}
