"use client";

import {
  CheckCircle2Icon,
  AlertTriangleIcon,
  PencilIcon,
  MoreVerticalIcon,
  KeyRoundIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Badge, Button, BrandIcon } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { staggerItem } from "@/shared/lib/motion-presets";
import {
  CREDENTIAL_TYPE_LABELS,
  type CredentialType,
} from "@/shared/config/constants";
import type { Credential } from "@/entities/credential";
import { deriveCredentialMetrics } from "../lib/credentialMetrics";

interface CredentialTableRowProps {
  credential: Credential;
  onRemove: (credentialId: string) => void;
}

/** Satu baris tabel kredensial dengan metrik (gambar 1). */
export function CredentialTableRow({
  credential,
  onRemove,
}: CredentialTableRowProps) {
  const metrics = deriveCredentialMetrics(credential);
  const isExpired = metrics.status === "expired";

  return (
    <motion.tr
      variants={staggerItem}
      className="border-border hover:bg-accent/40 border-b last:border-0"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="border-border grid size-9 shrink-0 place-items-center rounded-lg border bg-white">
            {metrics.brand ? (
              <BrandIcon name={metrics.brand} className="size-5" />
            ) : (
              <KeyRoundIcon className="size-4 text-orange-600" />
            )}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate text-sm font-semibold">
              {credential.name}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {metrics.description}
            </span>
            <span className="mt-1 w-fit">
              <Badge
                variant={metrics.environment === "Staging" ? "warning" : "info"}
              >
                {metrics.environment}
              </Badge>
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {metrics.brand ? (
            <BrandIcon name={metrics.brand} className="size-4" />
          ) : (
            <KeyRoundIcon className="text-muted-foreground size-4" />
          )}
          <div className="flex flex-col">
            <span className="text-foreground text-sm">{metrics.typeLabel}</span>
            <span className="text-muted-foreground text-xs">
              {metrics.providerLabel}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <AlertTriangleIcon className="size-4 text-amber-500" />
          ) : (
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          )}
          <div className="flex flex-col">
            <Badge variant={isExpired ? "warning" : "success"}>
              {isExpired ? "Expired" : "Active"}
            </Badge>
            <span
              className={cn(
                "mt-0.5 text-xs",
                isExpired ? "text-amber-600" : "text-muted-foreground",
              )}
            >
              {metrics.statusDetail}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-foreground text-sm">
            {metrics.lastUsedLabel}
          </span>
          <span className="text-muted-foreground text-xs">
            {metrics.lastUsedBy}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-foreground text-sm">
            {metrics.createdRelative}
          </span>
          <span className="text-muted-foreground text-xs">
            {metrics.createdDate}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {isExpired ? (
            <Button
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              Update
            </Button>
          ) : (
            <button
              type="button"
              className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
              aria-label="Edit kredensial"
            >
              <PencilIcon className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(credential.id)}
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
            aria-label={`Aksi untuk ${CREDENTIAL_TYPE_LABELS[credential.type as CredentialType]}`}
          >
            <MoreVerticalIcon className="size-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
