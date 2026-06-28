"use client";

import { useEffect } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { useCredentialStore } from "@/entities/credential";

interface AiAgentCredentialsProps {
  /** Daftar id kredensial AI terurut (indeks 0 = prioritas utama). */
  selectedIds: string[];
  onChange: (credentialIds: string[]) => void;
}

/**
 * Pemilih kredensial AI berurutan untuk node AI Agent. Urutan menentukan
 * prioritas fallback: kredensial teratas dipakai lebih dulu, sisanya menjadi
 * cadangan saat model utama sibuk atau gagal.
 */
export function AiAgentCredentials({
  selectedIds,
  onChange,
}: AiAgentCredentialsProps) {
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

  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted-foreground block text-xs font-medium">
        AI Credentials (order = fallback priority)
      </label>

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

              <span className="flex-1 truncate text-xs">
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

      {availableToAdd.length > 0 ? (
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
      ) : (
        aiCredentials.length === 0 && (
          <p className="text-xs text-amber-600">
            No AI credentials yet. Add an &quot;AI Provider&quot; type on the
            Credentials page first.
          </p>
        )
      )}

      {selectedIds.length === 0 && aiCredentials.length > 0 && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <PlusIcon className="size-3" />
          Select at least one AI credential to run.
        </p>
      )}
    </div>
  );
}
