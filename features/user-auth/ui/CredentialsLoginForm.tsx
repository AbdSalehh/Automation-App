"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Spinner } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

/**
 * Gaya input form login: kotak abu muda yang berubah putih saat difokuskan.
 * Kelas `dark:` ikut ditimpa agar tampilan tidak berubah mengikuti tema OS.
 */
const INPUT_CLASS_NAME =
  "short:py-2.5 h-auto rounded-xl border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-900 shadow-none placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 dark:bg-neutral-100";

const LABEL_CLASS_NAME = "text-xs font-semibold text-neutral-700";

/**
 * Form login berbasis kredensial email & password dengan tombol toggle
 * visibilitas password dan tautan lupa password.
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
        "Your Google account is awaiting admin approval. You will be able to sign in once it is approved.",
      );
    } else if (errorCode === "AccessDenied") {
      setError("Access denied. Contact your admin for more information.");
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
        setError("Invalid email or password.");
        return;
      }

      router.push(ROUTES.workflows);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="short:gap-3 flex w-full flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={LABEL_CLASS_NAME}>
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className={INPUT_CLASS_NAME}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={LABEL_CLASS_NAME}>
          Password
        </label>

        <div className="relative">
          <Input
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={`${INPUT_CLASS_NAME} pr-10`}
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((previous) => !previous)}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-neutral-400 transition-colors hover:text-neutral-700"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            toast.info(
              "Please contact your administrator to reset your password.",
            )
          }
          className="text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
        >
          Forgot password?
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
        className="short:py-3 h-auto w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-neutral-800 active:scale-[0.99]"
      >
        {isLoading ? <Spinner /> : "Sign In"}
      </Button>
    </form>
  );
}
