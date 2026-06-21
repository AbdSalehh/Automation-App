"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button, Input } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

/**
 * Form login berbasis kredensial email & password dengan ikon dalam input,
 * tombol toggle visibilitas password, dan tautan lupa password.
 */
interface CredentialsLoginFormProps {
  disabled?: boolean;
}

export function CredentialsLoginForm({
  disabled = false,
}: CredentialsLoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login Google yang belum disetujui admin diarahkan kembali ke halaman ini
   * dengan `?error=PendingApproval`. Tampilkan pesan ramah dari param tersebut.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");

    if (errorCode === "PendingApproval") {
      setError(
        "Akun Google Anda sedang menunggu persetujuan admin. Anda akan bisa masuk setelah disetujui.",
      );
    } else if (errorCode === "AccessDenied") {
      setError("Akses ditolak. Hubungi admin untuk informasi lebih lanjut.");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password tidak valid.");
        return;
      }

      router.push(ROUTES.workflows);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-foreground text-sm font-bold">
          Email
        </label>

        <div className="relative">
          <MailIcon className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            id="email"
            type="email"
            placeholder="nama@contoh.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="h-12 rounded-lg pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-foreground text-sm font-bold">
          Password
        </label>

        <div className="relative">
          <LockIcon className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <Input
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="Masukkan password Anda"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="h-12 rounded-lg pr-10 pl-10"
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((previous) => !previous)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
            aria-label={
              isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"
            }
          >
            {isPasswordVisible ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          className="self-end text-sm font-semibold text-orange-500 transition-colors hover:text-orange-600"
        >
          Lupa password?
        </button>
      </div>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || disabled}
        className="h-12 w-full rounded-lg bg-orange-500 text-base font-bold shadow-sm hover:bg-orange-600"
      >
        {isLoading ? "Masuk..." : "Masuk ke Akun"}
      </Button>
    </form>
  );
}
