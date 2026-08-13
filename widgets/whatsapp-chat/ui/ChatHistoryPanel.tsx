"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneCallIcon, VideoIcon, UsersIcon, ContactIcon } from "lucide-react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";
import type { ChatMessage } from "@/entities/whatsapp-session";
import { ChatMedia, LinkPreview } from "./ChatMedia";

/** Panel riwayat pesan kronologis untuk percakapan yang sedang aktif. */
export function ChatHistoryPanel() {
  const {
    activeJid,
    messages,
    messagesMetadata,
    isLoadingMessages,
    fetchMoreMessages,
  } = useChatHistoryStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadPreviousSentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingPreviousMessagesRef = useRef(false);
  const initialScrolledJidRef = useRef<string | null>(null);
  const previousActiveJidRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const [pendingReplyId, setPendingReplyId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  const handleLoadPreviousMessages = useCallback(async () => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || isLoadingPreviousMessagesRef.current) {
      return;
    }

    isLoadingPreviousMessagesRef.current = true;
    const previousScrollHeight = scrollContainer.scrollHeight;
    const previousScrollTop = scrollContainer.scrollTop;

    await fetchMoreMessages();

    requestAnimationFrame(() => {
      scrollContainer.scrollTop =
        previousScrollTop +
        (scrollContainer.scrollHeight - previousScrollHeight);
      isLoadingPreviousMessagesRef.current = false;
    });
  }, [fetchMoreMessages]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (previousActiveJidRef.current !== activeJid) {
      initialScrolledJidRef.current = null;
      previousActiveJidRef.current = activeJid;
    }

    if (!activeJid || !scrollContainer) {
      return;
    }

    if (
      messages.length === 0 ||
      isLoadingMessages ||
      initialScrolledJidRef.current === activeJid
    ) {
      return;
    }

    const scrollToLatestMessage = () => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    };
    const firstFrame = requestAnimationFrame(() => {
      const secondFrame = requestAnimationFrame(() => {
        scrollToLatestMessage();
        initialScrolledJidRef.current = activeJid;
      });

      scrollContainer.dataset.initialScrollFrame = String(secondFrame);
    });
    const resizeObserver = new ResizeObserver(scrollToLatestMessage);

    resizeObserver.observe(scrollContainer);

    return () => {
      cancelAnimationFrame(firstFrame);

      const secondFrame = Number(scrollContainer.dataset.initialScrollFrame);

      if (secondFrame) {
        cancelAnimationFrame(secondFrame);
      }

      delete scrollContainer.dataset.initialScrollFrame;
      resizeObserver.disconnect();
    };
  }, [activeJid, isLoadingMessages, messages.length]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const loadPreviousSentinel = loadPreviousSentinelRef.current;

    if (
      !scrollContainer ||
      !loadPreviousSentinel ||
      !messagesMetadata?.hasMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMessages) {
          void handleLoadPreviousMessages();
        }
      },
      { root: scrollContainer, rootMargin: "160px 0px 0px" },
    );

    observer.observe(loadPreviousSentinel);

    return () => observer.disconnect();
  }, [
    handleLoadPreviousMessages,
    isLoadingMessages,
    messagesMetadata?.hasMore,
  ]);

  useEffect(() => {
    if (!pendingReplyId) {
      return;
    }

    const targetMessage = document.getElementById(
      getMessageElementId(pendingReplyId),
    );

    if (!targetMessage) {
      if (messagesMetadata?.hasMore && !isLoadingMessages) {
        void handleLoadPreviousMessages();
      } else if (!messagesMetadata?.hasMore) {
        requestAnimationFrame(() => setPendingReplyId(null));
      }

      return;
    }

    const replyId = pendingReplyId;
    const highlightFrame = requestAnimationFrame(() => {
      targetMessage.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(replyId);
      setPendingReplyId(null);

      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }

      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedMessageId(null);
        highlightTimerRef.current = null;
      }, 1800);
    });

    return () => cancelAnimationFrame(highlightFrame);
  }, [
    handleLoadPreviousMessages,
    isLoadingMessages,
    messages,
    messagesMetadata?.hasMore,
    pendingReplyId,
  ]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  if (!activeJid) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Pilih percakapan untuk melihat riwayat pesan.
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <ScrollArea
        className="h-full max-h-full min-h-0 flex-1"
        viewportRef={scrollContainerRef}
        viewportProps={{ className: "overscroll-contain" }}
      >
        <div className="flex min-h-full min-w-0 flex-col gap-2 p-2">
          {messagesMetadata?.hasMore && (
            <div
              ref={loadPreviousSentinelRef}
              className="flex h-8 shrink-0 items-center justify-center"
              aria-hidden="true"
            >
              {isLoadingMessages && <Spinner className="size-4" />}
            </div>
          )}

          {messages.length === 0 && !isLoadingMessages ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Belum ada pesan tersimpan.
            </p>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isHighlighted={highlightedMessageId === message.id}
                onReplyClick={setPendingReplyId}
              />
            ))
          )}

          {isLoadingMessages && messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="text-muted-foreground size-6" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatBubble({
  message,
  isHighlighted,
  onReplyClick,
}: {
  message: ChatMessage;
  isHighlighted: boolean;
  onReplyClick: (messageId: string) => void;
}) {
  return (
    <div
      id={getMessageElementId(message.id)}
      className={cn(
        "flex w-full max-w-[80%] transition-colors duration-500",
        isHighlighted && "bg-amber-400/10",
      )}
    >
      <div
        className={cn(
          "flex max-w-full min-w-0 flex-col gap-1 overflow-hidden rounded-2xl px-3 py-2 text-sm shadow-sm",
          message.fromMe
            ? "ml-auto rounded-br-sm bg-emerald-600 text-white"
            : "bg-muted text-foreground mr-auto rounded-bl-sm",
        )}
      >
        {!message.fromMe && message.jid.endsWith("@g.us") && message.name && (
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            {message.name}
          </span>
        )}

        {message.replyTo && (
          <ReplyPreview message={message} onReplyClick={onReplyClick} />
        )}

        {message.messageType === "call" && message.call && (
          <CallPreview message={message} />
        )}

        {message.messageType === "contact" && (
          <ContactPreview message={message} />
        )}

        {message.media &&
          !["contact", "call"].includes(message.messageType) && (
            <ChatMedia message={message} />
          )}

        {message.message && (
          <>
            <LinkPreview message={message.message} />
            <p className="min-w-0 wrap-anywhere whitespace-pre-wrap">
              {renderMessageWithMentions(message.message, message.mentions)}
            </p>
          </>
        )}

        <span
          className={cn(
            "self-end text-[10px]",
            message.fromMe ? "text-emerald-100" : "text-muted-foreground",
          )}
        >
          {formatTimestamp(message.sentAt)}
        </span>
      </div>
    </div>
  );
}

function renderMessageWithMentions(
  message: string,
  mentions: ChatMessage["mentions"],
) {
  const mentionByToken = new Map(
    (mentions ?? []).map((mention) => [`@${mention.number}`, mention.name]),
  );
  const tokens = message.split(/(@\d+)/g);

  return tokens.map((token, tokenIndex) => {
    const contactName = mentionByToken.get(token);

    if (!contactName) {
      return token;
    }

    return (
      <span
        key={`${token}-${tokenIndex}`}
        className="font-medium text-emerald-500"
      >
        @{contactName}
      </span>
    );
  });
}

function ReplyPreview({
  message,
  onReplyClick,
}: {
  message: ChatMessage;
  onReplyClick: (messageId: string) => void;
}) {
  const replyTo = message.replyTo;

  if (!replyTo) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => onReplyClick(replyTo.id)}
      className={cn(
        "block w-full max-w-full rounded-lg border-l-4 px-3 py-2 text-left text-xs wrap-anywhere transition-colors hover:bg-black/15 focus-visible:ring-2 focus-visible:outline-none",
        message.fromMe
          ? "border-emerald-200 bg-black/10 text-emerald-50"
          : "text-foreground border-emerald-500 bg-black/5",
      )}
      aria-label="Buka pesan yang dibalas"
    >
      <span className="block font-semibold">Pesan yang dibalas</span>
      <span className="block max-w-125 truncate opacity-80">
        {replyTo.message || formatMessageType(replyTo.messageType)}
      </span>
    </button>
  );
}

function CallPreview({ message }: { message: ChatMessage }) {
  const call = message.call;

  if (!call) {
    return null;
  }

  const CallTypeIcon = call.isVideo ? VideoIcon : PhoneCallIcon;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-2">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/15">
        <CallTypeIcon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">
          {call.isVideo ? "Panggilan video" : "Panggilan suara"}
        </p>
        <p className="flex items-center gap-1 text-xs opacity-75">
          {call.isGroup && <UsersIcon className="size-3" />}
          {formatCallStatus(call.status, call.durationSeconds)}
          {call.durationSeconds !== null &&
            ` · ${formatCallDuration(call.durationSeconds)}`}
        </p>
      </div>
    </div>
  );
}
function ContactPreview({ message }: { message: ChatMessage }) {
  const contactPayload = message.media;

  if (message.messageType !== "contact" || !contactPayload) {
    return null;
  }

  const contacts = getSharedContacts(contactPayload);

  if (contacts.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-xl bg-black/10 px-3 py-2">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/15">
        <ContactIcon className="size-4" />
      </div>
      <div className="min-w-0 space-y-2">
        {contacts.map((contact, contactIndex) => (
          <div
            key={`${contact.displayName}-${contact.phoneNumber}-${contactIndex}`}
            className="min-w-0"
          >
            <p className="font-medium">{contact.displayName}</p>
            <p className="truncate text-xs opacity-75">
              {contact.phoneNumber || "Kontak dibagikan"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSharedContacts(contactPayload: NonNullable<ChatMessage["media"]>) {
  if ("contacts" in contactPayload) {
    return contactPayload.contacts;
  }

  if ("displayName" in contactPayload && "contactCount" in contactPayload) {
    return [
      {
        displayName: contactPayload.displayName,
        phoneNumber: contactPayload.phoneNumber,
      },
    ];
  }

  return [];
}

function formatMessageType(messageType: ChatMessage["messageType"]): string {
  const messageTypeLabels: Record<ChatMessage["messageType"], string> = {
    text: "Pesan teks",
    image: "Gambar",
    video: "Video",
    audio: "Audio",
    document: "Dokumen",
    sticker: "Stiker",
    location: "Lokasi",
    contact: "Kontak",
    call: "Panggilan",
  };

  return messageTypeLabels[messageType];
}

function formatCallStatus(
  status: NonNullable<ChatMessage["call"]>["status"],
  durationSeconds: number | null,
): string {
  if (status === "terminate") {
    return durationSeconds === null ? "Panggilan selesai" : "Selesai";
  }

  const statusLabels: Record<
    Exclude<NonNullable<ChatMessage["call"]>["status"], "terminate">,
    string
  > = {
    offer: "Memanggil",
    ringing: "Berdering",
    accept: "Diterima",
    reject: "Panggilan ditolak",
    timeout: "Tidak terjawab",
  };

  return statusLabels[status];
}

function formatCallDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getMessageElementId(messageId: string): string {
  return `chat-message-${encodeURIComponent(messageId)}`;
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
