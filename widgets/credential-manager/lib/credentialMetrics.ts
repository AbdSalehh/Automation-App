import type { Credential } from "@/entities/credential";
import type { CredentialType } from "@/shared/config/constants";
import type { BrandIconName } from "@/shared/ui";

/** Status tampilan kredensial di tabel (dummy hingga backend menyediakan). */
export type CredentialDisplayStatus = "active" | "expired";

export interface CredentialMetrics {
  description: string;
  environment: "Production" | "Staging";
  brand: BrandIconName | null;
  providerLabel: string;
  typeLabel: string;
  status: CredentialDisplayStatus;
  statusDetail: string;
  lastUsedLabel: string;
  lastUsedBy: string;
  createdRelative: string;
  createdDate: string;
}

/** Pemetaan tipe kredensial ke brand icon + label provider/tipe. */
const TYPE_META: Partial<
  Record<
    CredentialType,
    { brand: BrandIconName | null; provider: string; typeLabel: string }
  >
> = {
  whatsapp: { brand: "whatsapp", provider: "Meta", typeLabel: "WhatsApp" },
  whatsapp_oauth: {
    brand: "whatsapp",
    provider: "Meta",
    typeLabel: "WhatsApp",
  },
  telegram: { brand: "telegram", provider: "Telegram", typeLabel: "Telegram" },
  telegram_personal: {
    brand: "telegram",
    provider: "Telegram",
    typeLabel: "Telegram",
  },
  gemini: { brand: "gemini", provider: "Google", typeLabel: "Gemini" },
  agent_chat: {
    brand: "telegram",
    provider: "Telegram + Gemini",
    typeLabel: "Agent Chat",
  },
  google_oauth: {
    brand: "google-sheets",
    provider: "Google",
    typeLabel: "Google Sheets",
  },
  google_service_account: {
    brand: "google-sheets",
    provider: "Google",
    typeLabel: "Google Sheets",
  },
  google_calendar: {
    brand: "google-calendar",
    provider: "Google",
    typeLabel: "Calendar",
  },
  http: { brand: null, provider: "Webhook", typeLabel: "HTTP" },
};

const DESCRIPTIONS = [
  "Used for Google Sheets and Drive access",
  "Connection for sending automated messages",
  "Used for sending notification emails",
  "Primary database for storing application data",
  "Send notifications to related channels",
  "Cache and queue for performance optimization",
];

const LAST_USED = [
  "2 minutes ago",
  "15 minutes ago",
  "1 hour ago",
  "3 hours ago",
  "5 hours ago",
  "2 days ago",
];

const USED_BY = [
  "by Invoice Reminder",
  "by Customer Followup",
  "by Email Report Daily",
  "by Lead Capture",
  "by Error Notifier",
  "by Cache System",
];

const CREATED_RELATIVE = [
  "2 weeks ago",
  "3 weeks ago",
  "1 month ago",
  "1 month ago",
  "2 months ago",
  "2 months ago",
];

const CREATED_DATE = [
  "May 8, 2025",
  "Apr 28, 2025",
  "Apr 10, 2025",
  "Apr 12, 2025",
  "Mar 20, 2025",
  "Mar 18, 2025",
];

/** Hash sederhana & deterministik dari id agar metrik dummy stabil. */
function hashId(credentialId: string): number {
  let hash = 0;

  for (let index = 0; index < credentialId.length; index += 1) {
    hash = (hash * 31 + credentialId.charCodeAt(index)) % 100000;
  }

  return hash;
}

/**
 * Menurunkan metrik tampilan untuk satu kredensial. Field yang belum tersedia
 * di backend (deskripsi, environment, status, last used) memakai data dummy
 * deterministik berbasis id sehingga konsisten antar render.
 */
export function deriveCredentialMetrics(
  credential: Credential,
): CredentialMetrics {
  const seed = hashId(credential.id);
  const bucket = seed % 6;

  const meta = TYPE_META[credential.type] ?? {
    brand: null,
    provider: "Generic",
    typeLabel: credential.type,
  };

  const isExpired = seed % 11 === 0;

  return {
    description: DESCRIPTIONS[bucket],
    environment: seed % 4 === 0 ? "Staging" : "Production",
    brand: meta.brand,
    providerLabel: meta.provider,
    typeLabel: meta.typeLabel,
    status: isExpired ? "expired" : "active",
    statusDetail: isExpired ? "Expired 2 days ago" : "Valid",
    lastUsedLabel: LAST_USED[bucket],
    lastUsedBy: USED_BY[bucket],
    createdRelative: CREATED_RELATIVE[bucket],
    createdDate: CREATED_DATE[bucket],
  };
}

/** Ringkasan agregat untuk kartu statistik di atas tabel. */
export function summarizeCredentials(credentials: Credential[]) {
  const statuses = credentials.map(
    (credential) => deriveCredentialMetrics(credential).status,
  );

  return {
    total: credentials.length,
    encrypted: credentials.length,
    connected: statuses.filter((status) => status === "active").length,
    expired: statuses.filter((status) => status === "expired").length,
  };
}
