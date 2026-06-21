/** Jenis notifikasi yang dikenal sistem. Bebas diperluas di server. */
export type NotificationType =
  | "workflow_success"
  | "workflow_failed"
  | "account_approved"
  | "account_pending"
  | "credential_failed"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
