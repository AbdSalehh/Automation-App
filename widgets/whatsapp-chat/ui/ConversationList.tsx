"use client";

import {
  ImageIcon,
  VideoIcon,
  FileIcon,
  MicIcon,
  StickerIcon,
  PhoneCallIcon,
  UsersIcon,
  MapPinIcon,
  ContactIcon,
} from "lucide-react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";
import type { ConversationSummary } from "@/entities/whatsapp-session";

const MEDIA_ICON_BY_TYPE = {
  image: ImageIcon,
  video: VideoIcon,
  audio: MicIcon,
  document: FileIcon,
  sticker: StickerIcon,
  location: MapPinIcon,
  contact: ContactIcon,
  call: PhoneCallIcon,
};

/**
 * Daftar percakapan (ringkasan chat) milik sesi WhatsApp pengguna. Memuat 15
 * percakapan awal, dengan tombol "Muat lebih banyak" untuk paginasi
 * berikutnya berdasarkan `metadata.hasMore`/`offset`.
 */
export function ConversationList() {
  const {
    conversations,
    conversationsMetadata,
    isLoadingConversations,
    activeJid,
    fetchConversations,
    openConversation,
  } = useChatHistoryStore();

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && !isLoadingConversations ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            Belum ada percakapan.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.jid}
                conversation={conversation}
                isActive={conversation.jid === activeJid}
                onClick={() => openConversation(conversation.jid)}
              />
            ))}
          </ul>
        )}

        {isLoadingConversations && (
          <div className="flex items-center justify-center py-4">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        )}
      </div>

      {conversationsMetadata?.hasMore && !isLoadingConversations && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fetchConversations({ reset: false })}
        >
          Muat lebih banyak
        </Button>
      )}
    </div>
  );
}

function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  const lastMessage = conversation.lastMessage;
  const MediaIcon = lastMessage?.messageType
    ? MEDIA_ICON_BY_TYPE[
        lastMessage.messageType as keyof typeof MEDIA_ICON_BY_TYPE
      ]
    : null;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
          isActive ? "bg-accent" : "hover:bg-accent/50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-foreground truncate text-sm font-medium">
              {conversation.name || conversation.jid.split("@")[0]}
            </span>
            {conversation.jid.endsWith("@g.us") && (
              <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]">
                <UsersIcon className="size-3" />
                Grup
              </span>
            )}
          </div>

          {lastMessage?.sentAt && (
            <span className="text-muted-foreground shrink-0 text-[11px]">
              {formatTimeLabel(lastMessage.sentAt)}
            </span>
          )}
        </div>

        <div className="text-muted-foreground flex items-center gap-1 truncate text-xs">
          {lastMessage?.fromMe && <span className="shrink-0">Anda:</span>}
          {MediaIcon && <MediaIcon className="size-3 shrink-0" />}
          <span className="truncate">
            {lastMessage?.message ||
              getPreviewLabel(lastMessage, Boolean(MediaIcon))}
          </span>
        </div>
      </button>
    </li>
  );
}

function getPreviewLabel(
  lastMessage: ConversationSummary["lastMessage"],
  hasMediaIcon: boolean,
): string {
  if (!lastMessage) {
    return "Belum ada pesan";
  }

  const labels = {
    call: "Panggilan WhatsApp",
    location: "Lokasi dibagikan",
    contact: "Kontak dibagikan",
  };

  return (
    labels[lastMessage.messageType as keyof typeof labels] ||
    (hasMediaIcon ? "Media" : "Belum ada pesan")
  );
}

function formatTimeLabel(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
