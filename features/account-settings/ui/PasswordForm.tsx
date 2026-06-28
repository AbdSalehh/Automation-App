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
      setLocalError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Password confirmation does not match.");
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
      className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-foreground text-sm font-semibold">
          Change Password
        </h3>
        <p className="text-muted-foreground text-xs">
          Use a strong password that you do not reuse elsewhere.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="currentPassword"
          className="text-foreground text-sm font-medium"
        >
          Current Password
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
          className="text-foreground text-sm font-medium"
        >
          New Password
        </label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(changeEvent) => setNewPassword(changeEvent.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="confirmPassword"
          className="text-foreground text-sm font-medium"
        >
          Confirm New Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(changeEvent) =>
            setConfirmPassword(changeEvent.target.value)
          }
          placeholder="Repeat the new password"
        />
      </div>

      {(localError || errorMessage) && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {localError ?? errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <Button type="submit" disabled={isChangingPassword} className="w-fit">
        {isChangingPassword ? "Saving..." : "Change Password"}
      </Button>
    </form>
  );
}
