"use client";

import { useEffect } from "react";
import { Trash2Icon } from "lucide-react";
import { Badge, Button, Card, Spinner } from "@/shared/ui";
import { formatDateTime } from "@/shared/lib/formatDate";
import {
  CREDENTIAL_TYPE_LABELS,
  type CredentialType,
} from "@/shared/config/constants";
import { useCredentialStore } from "@/entities/credential";
import { CredentialForm } from "@/features/manage-credentials";

export function CredentialManager() {
  const {
    credentials,
    isLoading,
    errorMessage,
    fetchCredentials,
    removeCredential,
  } = useCredentialStore();

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credentials</h1>
          <p className="text-sm text-muted-foreground">
            Kredensial konektor tersimpan terenkripsi dan hanya milik Anda.
          </p>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {isLoading ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Memuat…
          </span>
        ) : credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            Belum ada kredensial.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {credentials.map((credential) => (
              <li
                key={credential.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {credential.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Dibuat {formatDateTime(credential.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="info">
                    {CREDENTIAL_TYPE_LABELS[credential.type as CredentialType]}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeCredential(credential.id)}
                    aria-label="Hapus kredensial"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Card className="gap-4 p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Tambah Kredensial
        </h2>

        <CredentialForm />
      </Card>
    </div>
  );
}
