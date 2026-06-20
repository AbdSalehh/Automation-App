"use client";

import { useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/shared/ui/checkbox";
import { ROUTES } from "@/shared/config/constants";
import { CredentialsLoginForm } from "./CredentialsLoginForm";
import { LoginButton } from "./LoginButton";

/**
 * Membungkus form login dan tombol Google dengan checkbox persetujuan Syarat
 * Layanan & Kebijakan Privasi. Tombol masuk tetap nonaktif sampai pengguna
 * mencentang persetujuan.
 */
export function LoginConsentGate() {
  const [hasAgreed, setHasAgreed] = useState(false);

  return (
    <div className="flex w-full flex-col gap-5">
      <CredentialsLoginForm disabled={!hasAgreed} />

      <div className="flex w-full items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs font-medium">
          atau masuk dengan
        </span>
        <div className="bg-border h-px flex-1" />
      </div>

      <LoginButton disabled={!hasAgreed} />

      <label
        htmlFor="loginConsent"
        className="flex cursor-pointer items-start gap-2.5"
      >
        <Checkbox
          id="loginConsent"
          checked={hasAgreed}
          onCheckedChange={(checked) => setHasAgreed(checked === true)}
          className="mt-0.5"
        />
        <span className="text-muted-foreground text-xs leading-relaxed">
          Saya menyetujui{" "}
          <Link
            href={ROUTES.terms}
            target="_blank"
            className="font-semibold text-orange-500 hover:text-orange-600 hover:underline"
          >
            Syarat Layanan
          </Link>{" "}
          dan{" "}
          <Link
            href={ROUTES.privacy}
            target="_blank"
            className="font-semibold text-orange-500 hover:text-orange-600 hover:underline"
          >
            Kebijakan Privasi
          </Link>{" "}
          {""}.
        </span>
      </label>
    </div>
  );
}
