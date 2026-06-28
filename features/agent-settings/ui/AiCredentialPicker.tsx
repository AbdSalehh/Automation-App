"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, XIcon } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { useCredentialStore } from "@/entities/credential";

interface AiCredentialPickerProps {
  /** Id kredensial AI terurut (indeks 0 = prioritas utama). */
  selectedIds: string[];
  onChange: (credentialIds: string[]) => void;
}

/**
 * Pemilih kredensial AI berurutan untuk agen chat-action. Urutan menentukan
 * prioritas fallback: kredensial teratas dipakai lebih dulu, sisanya cadangan
 * saat model utama sibuk atau gagal.
 */
export function AiCredentialPicker({
  selectedIds,
  onChange,
}: AiCredentialPickerProps) {
  const { credentials, fetchCredentials, credentialsByType } =
    useCredentialStore();

  useEffect(() => {
    if (credentials.length === 0) {
      fetchCredentials();
    }
  }, [credentials.length, fetchCredentials]);

  const aiCredentials = credentialsByType("ai");

  const availableToAdd = aiCredentials.filter(
    (credential) => !selectedIds.includes(credential.id),
  );

  const nameById = (credentialId: string) =>
    aiCredentials.find((credential) => credential.id === credentialId)?.name ??
    "Credential deleted";

  const addCredential = (credentialId: string) => {
    if (selectedIds.includes(credentialId)) {
      return;
    }

    onChange([...selectedIds, credentialId]);
  };

  const removeCredential = (credentialId: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== credentialId));
  };

  const moveCredential = (credentialId: string, direction: "up" | "down") => {
    const index = selectedIds.indexOf(credentialId);

    if (index === -1) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= selectedIds.length) {
      return;
    }

    const reordered = [...selectedIds];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    onChange(reordered);
  };

  if (aiCredentials.length === 0) {
    return (
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        No AI credentials yet. Add an &quot;AI Provider&quot; type on the{" "}
        <Link href="/credentials" className="font-semibold underline">
          Credentials
        </Link>{" "}
        page first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {selectedIds.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedIds.map((credentialId, index) => (
            <div
              key={credentialId}
              className="border-border bg-muted/30 flex items-center gap-2 rounded-md border px-2 py-1.5"
            >
              <span className="bg-primary/10 text-primary grid size-5 shrink-0 place-items-center rounded text-xs font-semibold">
                {index + 1}
              </span>

              <span className="flex-1 truncate text-sm">
                {nameById(credentialId)}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => moveCredential(credentialId, "up")}
                aria-label="Increase priority"
              >
                <ArrowUpIcon className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={index === selectedIds.length - 1}
                onClick={() => moveCredential(credentialId, "down")}
                aria-label="Decrease priority"
              >
                <ArrowDownIcon className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeCredential(credentialId)}
                aria-label="Delete credential"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {availableToAdd.length > 0 && (
        <Select value="" onValueChange={addCredential}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="+ Add AI credential" />
          </SelectTrigger>

          <SelectContent>
            {availableToAdd.map((credential) => (
              <SelectItem key={credential.id} value={credential.id}>
                {credential.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
