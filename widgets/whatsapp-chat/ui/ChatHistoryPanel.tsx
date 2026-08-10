"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  FileIcon,
  DownloadIcon,
  PhoneCallIcon,
  VideoIcon,
  UsersIcon,
  MapPinIcon,
  ContactIcon,
} from "lucide-react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";
import type { ChatMessage } from "@/entities/whatsapp-session";

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
  const isLoadingPreviousMessagesRef = useRef(false);

  if (!activeJid) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Pilih percakapan untuk melihat riwayat pesan.
      </div>
    );
  }

  const handleLoadPreviousMessages = async () => {
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
  };

  const handleScroll = () => {
    const scrollContainer = scrollContainerRef.current;

    if (
      scrollContainer &&
      scrollContainer.scrollTop < 120 &&
      messagesMetadata?.hasMore &&
      !isLoadingMessages
    ) {
      handleLoadPreviousMessages();
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
        onScroll={handleScroll}
      >
        {messagesMetadata?.hasMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mx-auto"
            disabled={isLoadingMessages}
            onClick={handleLoadPreviousMessages}
          >
            {isLoadingMessages ? (
              <Spinner className="size-4" />
            ) : (
              "Muat pesan sebelumnya"
            )}
          </Button>
        )}

        {messages.length === 0 && !isLoadingMessages ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Belum ada pesan tersimpan.
          </p>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}

        {isLoadingMessages && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="text-muted-foreground size-6" />
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={cn(
        "flex max-w-3/4 flex-col gap-1 rounded-2xl px-3 py-2 text-sm shadow-sm",
        message.fromMe
          ? "self-end rounded-br-sm bg-emerald-600 text-white"
          : "bg-muted text-foreground self-start rounded-bl-sm",
      )}
    >
      {!message.fromMe && message.jid.endsWith("@g.us") && message.name && (
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
          {message.name}
        </span>
      )}

      {message.replyTo && <ReplyPreview message={message} />}

      {message.messageType === "call" && message.call && (
        <CallPreview message={message} />
      )}

      {message.messageType === "location" && (
        <LocationPreview message={message} />
      )}

      {message.messageType === "contact" && (
        <ContactPreview message={message} />
      )}

      {message.media &&
        !["location", "contact"].includes(message.messageType) && (
          <ChatMedia message={message} />
        )}

      {message.message && (
        <p className="wrap-break-word whitespace-pre-wrap">
          {renderMessageWithMentions(message.message, message.mentions)}
        </p>
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

function ReplyPreview({ message }: { message: ChatMessage }) {
  const replyTo = message.replyTo;

  if (!replyTo) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border-l-4 px-3 py-2 text-xs",
        message.fromMe
          ? "border-emerald-200 bg-black/10 text-emerald-50"
          : "text-foreground border-emerald-500 bg-black/5",
      )}
    >
      <span className="block font-semibold">Pesan yang dibalas</span>
      <span className="block truncate opacity-80">
        {replyTo.message || formatMessageType(replyTo.messageType)}
      </span>
    </div>
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

function LocationPreview({ message }: { message: ChatMessage }) {
  const location = message.media;

  if (
    message.messageType !== "location" ||
    !location ||
    !("latitude" in location) ||
    !("longitude" in location) ||
    !("url" in location)
  ) {
    return null;
  }

  return (
    <a
      href={location.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-2"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/15">
        <MapPinIcon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{location.name || "Lokasi dibagikan"}</p>
        <p className="truncate text-xs opacity-75">
          {location.address || `${location.latitude}, ${location.longitude}`}
        </p>
      </div>
    </a>
  );
}

function ContactPreview({ message }: { message: ChatMessage }) {
  const contact = message.media;

  if (
    message.messageType !== "contact" ||
    !contact ||
    !("displayName" in contact) ||
    !("contactCount" in contact)
  ) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/10 px-3 py-2">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/15">
        <ContactIcon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{contact.displayName}</p>
        <p className="truncate text-xs opacity-75">
          {contact.phoneNumber ||
            (contact.contactCount > 1
              ? `${contact.contactCount} kontak dibagikan`
              : "Kontak dibagikan")}
        </p>
      </div>
    </div>
  );
}

function ChatMedia({ message }: { message: ChatMessage }) {
  const media = message.media;

  if (!media || !("mimetype" in media)) {
    return null;
  }

  if (message.messageType === "image" || message.messageType === "sticker") {
    return (
      <Image
        src={media.url}
        alt={media.fileName || "Gambar"}
        width={240}
        height={240}
        className="rounded-lg object-cover"
        unoptimized
      />
    );
  }

  if (message.messageType === "video") {
    return (
      <video controls preload="metadata" className="max-w-full rounded-lg">
        <source src={media.url} type={media.mimetype || "video/mp4"} />
        Browser tidak mendukung pemutaran video ini.{" "}
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Unduh video
        </a>
      </video>
    );
  }

  if (message.messageType === "audio") {
    return <audio src={media.url} controls className="w-full" />;
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-xs"
    >
      <FileIcon className="size-4 shrink-0" />
      <span className="truncate">{media.fileName || "Dokumen"}</span>
      <DownloadIcon className="ml-auto size-3.5 shrink-0" />
    </a>
  );
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

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
