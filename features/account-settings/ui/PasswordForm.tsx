"use client";

import { useState } from "react";
import { Button, Input } from "@/shared/ui";
import { useAccountStore } from "@/entities/account";

/** Panjang minimal password baru, selaras dengan validasi server. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Form ubah password untuk akun berbasis kredensial. Komponen ini hanya
 * ditampilkan bila pengguna memiliki password (bukan login Google).
 */
export function PasswordForm() {
  const { isChangingPassword, errorMessage, successMessage, changePassword } =
    useAccountStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Konfirmasi password tidak cocok.");
      return;
    }

    setLocalError(null);

    const success = await changePassword(currentPassword, newPassword);

    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">Ubah Password</h3>
        <p className="text-xs text-muted-foreground">
          Gunakan password yang kuat dan tidak dipakai di tempat lain.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="currentPassword"
          className="text-sm font-medium text-foreground"
        >
          Password Lama
        </label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(changeEvent) =>
            setCurrentPassword(changeEvent.target.value)
          }
          placeholder="••••••••"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="newPassword"
          className="text-sm font-medium text-foreground"
        >
          Password Baru
        </label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(changeEvent) => setNewPassword(changeEvent.target.value)}
          placeholder="Minimal 8 karakter"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-foreground"
        >
          Konfirmasi Password Baru
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(changeEvent) =>
            setConfirmPassword(changeEvent.target.value)
          }
          placeholder="Ulangi password baru"
        />
      </div>

      {(localError || errorMessage) && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {localError ?? errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <Button type="submit" disabled={isChangingPassword} className="w-fit">
        {isChangingPassword ? "Menyimpan..." : "Ubah Password"}
      </Button>
    </form>
  );
}
