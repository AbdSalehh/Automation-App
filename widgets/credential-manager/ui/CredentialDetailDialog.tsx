"use client";

import { Modal } from "@/shared/ui";
import {
  CREDENTIAL_TYPE_LABELS,
  type CredentialType,
} from "@/shared/config/constants";
import type { Credential } from "@/entities/credential";
import { deriveCredentialMetrics } from "../lib/credentialMetrics";

interface CredentialDetailDialogProps {
  credential: Credential;
  open: boolean;
  onClose: () => void;
}

interface DetailRowProps {
  label: string;
  value: string;
}

/** Satu baris label-nilai di dalam dialog detail. */
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="border-border flex items-start justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

/** Dialog detail kredensial (read-only) memakai komponen Modal bersama. */
export function CredentialDetailDialog({
  credential,
  open,
  onClose,
}: CredentialDetailDialogProps) {
  const metrics = deriveCredentialMetrics(credential);

  return (
    <Modal open={open} onClose={onClose} title="Detail Kredensial">
      <div className="flex flex-col">
        <DetailRow label="Nama" value={credential.name} />
        <DetailRow
          label="Tipe"
          value={CREDENTIAL_TYPE_LABELS[credential.type as CredentialType]}
        />
        <DetailRow label="Provider" value={metrics.providerLabel} />
        <DetailRow label="Environment" value={metrics.environment} />
        <DetailRow
          label="Status"
          value={metrics.status === "expired" ? "Expired" : "Active"}
        />
        <DetailRow label="Terakhir dipakai" value={metrics.lastUsedLabel} />
        <DetailRow label="Dibuat" value={metrics.createdDate} />
      </div>
    </Modal>
  );
}
