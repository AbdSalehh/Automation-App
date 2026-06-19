"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button, Input } from "@/shared/ui";
import { useAccountStore } from "@/entities/account";

interface ProfileFormProps {
  initialName: string;
  initialImage: string | null;
}

/** Batas ukuran berkas foto profil (2MB) sebelum diunggah sebagai base64. */
const MAX_FILE_BYTES = 2 * 1024 * 1024;

/**
 * Form profil pengguna: ubah nama tampilan dan foto profil. Foto dibaca menjadi
 * data URL (base64) lalu dikirim ke store. State loading/error ada di store.
 */
export function ProfileForm({ initialName, initialImage }: ProfileFormProps) {
  const { isSavingProfile, errorMessage, successMessage, updateProfile } =
    useAccountStore();

  const [name, setName] = useState(initialName);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(initialImage);
  const [localError, setLocalError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    changeEvent: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = changeEvent.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setLocalError("Ukuran foto maksimal 2MB.");
      return;
    }

    setLocalError(null);

    const reader = new FileReader();

    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();

    await updateProfile({ name, image: imageDataUrl });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5"
    >
      <div className="flex flex-col gap-0.5">
        <h3 className="text-foreground text-sm font-semibold">Profil Saya</h3>
        <p className="text-muted-foreground text-xs">
          Perbarui nama tampilan dan foto profil akun Anda.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="border-border bg-muted relative size-16 overflow-hidden rounded-full border">
          {imageDataUrl ? (
            <Image
              src={imageDataUrl}
              alt="Foto profil"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-muted-foreground flex h-full w-full items-center justify-center text-lg font-semibold">
              {name.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Ganti Foto
          </Button>

          {imageDataUrl && (
            <button
              type="button"
              onClick={() => setImageDataUrl(null)}
              className="text-muted-foreground hover:text-destructive text-xs"
            >
              Hapus foto
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="profileName"
          className="text-foreground text-sm font-medium"
        >
          Nama Tampilan
        </label>
        <Input
          id="profileName"
          value={name}
          onChange={(changeEvent) => setName(changeEvent.target.value)}
          placeholder="Nama Anda"
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

      <Button type="submit" disabled={isSavingProfile} className="w-fit">
        {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
      </Button>
    </form>
  );
}
