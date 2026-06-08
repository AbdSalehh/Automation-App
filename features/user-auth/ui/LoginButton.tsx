"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

export function LoginButton() {
  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: ROUTES.workflows })}
      size="lg"
      className="gap-2"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.4-1.6 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.92 5.42 14.76 4.5 12.18 4.5 7.4 4.5 3.5 8.36 3.5 13.16s3.9 8.66 8.68 8.66c5.01 0 8.33-3.52 8.33-8.48 0-.57-.06-1.01-.16-1.45z"
        />
      </svg>
      Masuk dengan Google
    </Button>
  );
}
