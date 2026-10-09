"use client";

import { useEffect } from "react";
import {
  PhoneIncomingIcon,
  PhoneMissedIcon,
  PhoneOutgoingIcon,
  VideoIcon,
} from "lucide-react";

import { useCallStore, useChatHistoryStore } from "@/entities/whatsapp-session";
import type { WhatsappCallEntry } from "@/entities/whatsapp-session";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";

const callTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Status panggilan yang berarti tidak pernah tersambung. Dipakai untuk menandai
 * entri sebagai "tak terjawab" dan mewarnainya berbeda.
 */
const UNANSWERED_STATUSES = new Set(["timeout", "reject"]);

const STATUS_LABEL = {
  offer: "Berdering",
  ringing: "Berdering",
  accept: "Tersambung",
  terminate: "Selesai",
  reject: "Ditolak",
  timeout: "Tidak dijawab",
};

/**
 * Daftar panggilan WhatsApp hari ini — masuk maupun keluar — untuk sesi yang
 * sedang dipilih.
 */
export function CallHistoryList({
  onConversationOpened,
}: {
  onConversationOpened?: () => void;
}) {
  const activeSessionId = useChatHistoryStore((state) => state.activeSessionId);
  const activeOwnerId = useChatHistoryStore((state) => state.activeOwnerId);
  const openConversation = useChatHistoryStore(
    (state) => state.openConversation,
  );
  const calls = useCallStore((state) => state.calls);
  const metadata = useCallStore((state) => state.metadata);
  const isLoading = useCallStore((state) => state.isLoading);
  const errorMessage = useCallStore((state) => state.errorMessage);
  const fetchCalls = useCallStore((state) => state.fetchCalls);
  const reset = useCallStore((state) => state.reset);

  useEffect(() => {
    if (activeSessionId && activeOwnerId) {
      void fetchCalls(activeSessionId, activeOwnerId);
    } else {
      reset();
    }
  }, [activeOwnerId, activeSessionId, fetchCalls, reset]);

  if (isLoading && calls.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="text-muted-foreground size-5" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <p className="text-destructive p-4 text-center text-sm">{errorMessage}</p>
    );
  }

  if (calls.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-center text-sm">
        Belum ada panggilan hari ini.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      {metadata && (
        <div className="text-muted-foreground flex items-center justify-between px-1 text-xs font-medium">
          <span>Panggilan hari ini ({metadata.totalItems})</span>
          <span>
            {metadata.incomingCount} masuk · {metadata.outgoingCount} keluar
          </span>
        </div>
      )}

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {calls.map((call) => (
          <CallHistoryItem
            key={call.id}
            call={call}
            onClick={() => {
              void openConversation(call.jid).then(onConversationOpened);
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function CallHistoryItem({
  call,
  onClick,
}: {
  call: WhatsappCallEntry;
  onClick: () => void;
}) {
  const isUnanswered = UNANSWERED_STATUSES.has(call.status);
  const DirectionIcon = isUnanswered
    ? PhoneMissedIcon
    : call.fromMe
      ? PhoneOutgoingIcon
      : PhoneIncomingIcon;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-accent/50 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            isUnanswered
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/10 text-emerald-600",
          )}
        >
          <DirectionIcon className="size-4" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            <span className="text-foreground truncate text-sm font-medium">
              {call.name}
            </span>
            {call.isVideo && (
              <VideoIcon className="text-muted-foreground size-3 shrink-0" />
            )}
          </span>

          <span className="text-muted-foreground truncate text-xs">
            {call.fromMe ? "Keluar" : "Masuk"} ·{" "}
            {STATUS_LABEL[call.status as keyof typeof STATUS_LABEL] ??
              "Panggilan"}
            {call.durationSeconds !== null &&
              call.durationSeconds > 0 &&
              ` · ${formatCallDuration(call.durationSeconds)}`}
          </span>
        </span>

        <span className="text-muted-foreground shrink-0 text-[11px]">
          {callTimeFormatter.format(new Date(call.sentAt))}
        </span>
      </button>
    </li>
  );
}

/** Mengubah durasi detik menjadi label ringkas, mis. "2 mnt 5 dtk". */
function formatCallDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes === 0) {
    return `${seconds} dtk`;
  }

  return `${minutes} mnt ${seconds} dtk`;
}
