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
  EyeOffIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
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

/** Daftar percakapan (ringkasan chat) milik sesi WhatsApp pengguna. */
export function ConversationList({
  onConversationOpened,
}: {
  onConversationOpened?: () => void;
}) {
  const {
    conversations,
    conversationsMetadata,
    isLoadingConversations,
    activeJid,
    avatarUrls,
    fetchConversations,
    openConversation,
    fetchAvatar,
    hideConversation,
  } = useChatHistoryStore();
  const loadMoreReference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMoreElement = loadMoreReference.current;

    if (
      !loadMoreElement ||
      !conversationsMetadata?.hasMore ||
      isLoadingConversations
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchConversations({ reset: false });
        }
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [conversationsMetadata?.hasMore, fetchConversations, isLoadingConversations]);

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
                avatarUrl={avatarUrls[conversation.jid]}
                onFetchAvatar={() => void fetchAvatar(conversation.jid)}
                onHide={() => void hideConversation(conversation.jid)}
                onClick={() => {
                  void openConversation(conversation.jid).then(onConversationOpened);
                }}
              />
            ))}
          </ul>
        )}

        {conversationsMetadata?.hasMore && (
          <div ref={loadMoreReference} className="h-1" aria-hidden="true" />
        )}

        {isLoadingConversations && (
          <div className="flex items-center justify-center py-4">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationListItem({
  conversation,
  isActive,
  avatarUrl,
  onFetchAvatar,
  onHide,
  onClick,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
  avatarUrl?: string | null;
  onFetchAvatar: () => void;
  onHide: () => void;
  onClick: () => void;
}) {
  const lastMessage = conversation.lastMessage;
  const isGroup = conversation.jid.endsWith("@g.us");
  const displayName = conversation.name || conversation.jid.split("@")[0];
  const MediaIcon = lastMessage?.messageType
    ? MEDIA_ICON_BY_TYPE[
        lastMessage.messageType as keyof typeof MEDIA_ICON_BY_TYPE
      ]
    : null;

  useEffect(() => {
    onFetchAvatar();
  }, [onFetchAvatar]);

  return (
    <li className="group/item relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
          isActive ? "bg-accent" : "hover:bg-accent/50",
        )}
      >
        <ConversationAvatar
          avatarUrl={avatarUrl}
          displayName={displayName}
          isGroup={isGroup}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-foreground truncate text-sm font-medium">
                {displayName}
              </span>
              {isGroup && (
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
        </div>
      </button>

      <button
        type="button"
        title="Sembunyikan chat"
        aria-label={`Sembunyikan chat ${displayName}`}
        onClick={(clickEvent) => {
          clickEvent.stopPropagation();
          onHide();
        }}
        className={cn(
          "bg-background/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 opacity-0 transition-opacity group-hover/item:opacity-100",
        )}
      >
        <EyeOffIcon className="size-4" />
      </button>
    </li>
  );
}

function ConversationAvatar({
  avatarUrl,
  displayName,
  isGroup,
}: {
  avatarUrl?: string | null;
  displayName: string;
  isGroup: boolean;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className="size-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="bg-accent text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
      {isGroup ? <UsersIcon className="size-5" /> : initial}
    </div>
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
