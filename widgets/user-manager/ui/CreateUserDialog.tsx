"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button, Input, toast } from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { useManagedUserStore } from "@/entities/managed-user";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Dialog tambah pengguna baru oleh admin. Semua state submit/loading dikelola
 * di `useManagedUserStore`; komponen hanya menyimpan input form lokal.
 */
export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const { isSubmitting, createUser } = useManagedUserStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setShowPassword(false);
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (name.trim().length === 0) {
      setLocalError("Nama wajib diisi.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setLocalError("Format email tidak valid.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }

    setLocalError(null);

    const success = await createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });

    if (success) {
      toast.success(`Pengguna ${email.trim()} berhasil dibuat.`);
      resetForm();
      onOpenChange(false);
    } else {
      toast.error("Gagal membuat pengguna. Pastikan email belum terdaftar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah User</DialogTitle>
          <DialogDescription>
            Buat akun baru dengan email dan password. Akun langsung aktif dan
            dapat masuk.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-medium">Nama</label>
            <Input
              value={name}
              onChange={(changeEvent) => setName(changeEvent.target.value)}
              placeholder="Nama lengkap"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(changeEvent) => setEmail(changeEvent.target.value)}
              placeholder="nama@contoh.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(changeEvent) =>
                  setPassword(changeEvent.target.value)
                }
                placeholder="Minimal 8 karakter"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-medium">Role</label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as "user" | "admin")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localError && (
            <p className="text-destructive text-xs">{localError}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Batal</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Tambah User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
