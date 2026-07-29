"use client";

import Image from "next/image";
import { FileIcon, DownloadIcon } from "lucide-react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";
import type { ChatMessage } from "@/entities/whatsapp-session";

/**
 * Panel riwayat pesan (maksimal 24 jam) untuk percakapan yang sedang aktif.
 * Pesan datang dari API terurut terbaru->terlama; di sini dibalik agar tampil
 * kronologis (lama di atas, baru di bawah) layaknya UI chat pada umumnya.
 */
export function ChatHistoryPanel() {
  const {
    activeJid,
    messages,
    messagesMetadata,
    isLoadingMessages,
    fetchMoreMessages,
  } = useChatHistoryStore();

  if (!activeJid) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Pilih percakapan untuk melihat riwayat pesan.
      </div>
    );
  }

  const chronologicalMessages = [...messages].reverse();

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-1 flex-col-reverse gap-2 overflow-y-auto p-2">
        <div className="flex flex-col gap-2">
          {messagesMetadata?.hasMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mx-auto"
              disabled={isLoadingMessages}
              onClick={() => fetchMoreMessages()}
            >
              {isLoadingMessages ? (
                <Spinner className="size-4" />
              ) : (
                "Muat pesan sebelumnya"
              )}
            </Button>
          )}

          {chronologicalMessages.length === 0 && !isLoadingMessages ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Tidak ada pesan dalam 24 jam terakhir.
            </p>
          ) : (
            chronologicalMessages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}

          {isLoadingMessages && chronologicalMessages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="text-muted-foreground size-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl px-3 py-2 text-sm shadow-sm",
        "max-w-[75%]",
        message.fromMe
          ? "self-end rounded-br-sm bg-emerald-600 text-white"
          : "bg-muted text-foreground self-start rounded-bl-sm",
      )}
    >
      {message.media?.url && <ChatMedia message={message} />}

      {message.message && (
        <p className="break-words whitespace-pre-wrap">{message.message}</p>
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

function ChatMedia({ message }: { message: ChatMessage }) {
  const media = message.media;

  if (!media) {
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
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={media.url} controls className="max-w-full rounded-lg" />
    );
  }

  if (message.messageType === "audio") {
    // eslint-disable-next-line jsx-a11y/media-has-caption
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

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
