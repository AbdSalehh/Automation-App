"use client";

import Image from "next/image";
import { DownloadIcon, FileIcon, VideoIcon } from "lucide-react";

import {
  useChatHistoryStore,
  type ChatMessage,
  type InboundMedia,
} from "@/entities/whatsapp-session";
import { cn } from "@/shared/lib/utils";
import { Spinner, toast } from "@/shared/ui";
import { formatFileSize } from "../lib/formatFileSize";

const PREVIEW_WIDTH = 280;

/**
 * Media yang baru disimpan preview-nya untuk menghemat penyimpanan. Berkas
 * penuh diunduh dari WhatsApp lalu disimpan ke storage hanya setelah pengguna
 * menekan tombol unduh.
 */
export function DeferredMedia({
  message,
  media,
}: {
  message: ChatMessage;
  media: InboundMedia;
}) {
  const isDownloading = useChatHistoryStore((state) =>
    Boolean(state.downloadingMediaIds[message.id]),
  );
  const downloadMessageMedia = useChatHistoryStore(
    (state) => state.downloadMessageMedia,
  );

  const sizeLabel = media.fileLength > 0 ? formatFileSize(media.fileLength) : "";

  const handleDownload = async () => {
    const isDownloaded = await downloadMessageMedia(message.id);

    if (!isDownloaded) {
      toast.error("Media gagal diunduh. Coba lagi, atau buka di ponsel.");
    }
  };

  const downloadIcon = isDownloading ? (
    <Spinner className="size-4" />
  ) : (
    <DownloadIcon className="size-4" />
  );

  if (message.messageType === "document") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex w-full items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-left text-xs transition-colors hover:bg-black/15 disabled:opacity-70"
        aria-label={`Unduh ${media.fileName || "dokumen"}`}
      >
        <FileIcon className="size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate">{media.fileName || "Dokumen"}</span>
          <span className="opacity-70">
            {isDownloading ? "Mengunduh…" : sizeLabel || "Ketuk untuk mengunduh"}
          </span>
        </div>
        <span className="ml-auto shrink-0">{downloadIcon}</span>
      </button>
    );
  }

  const previewHeight =
    media.width && media.height
      ? Math.round((PREVIEW_WIDTH * media.height) / media.width)
      : PREVIEW_WIDTH;
  const isVideo = message.messageType === "video";

  return (
    <div
      className={cn(
        "relative max-w-full overflow-hidden rounded-lg bg-black/20",
        media.isVideoNote && "rounded-full",
      )}
    >
      {media.previewUrl ? (
        <Image
          src={media.previewUrl}
          alt={media.fileName || (isVideo ? "Preview video" : "Preview gambar")}
          width={PREVIEW_WIDTH}
          height={Math.min(previewHeight, 360)}
          className="max-h-80 max-w-full scale-105 object-cover blur-[2px]"
          unoptimized
        />
      ) : (
        <div className="grid h-48 w-64 max-w-full place-items-center bg-gradient-to-br from-black/10 to-black/30">
          {isVideo ? (
            <VideoIcon className="size-8 opacity-60" />
          ) : (
            <FileIcon className="size-8 opacity-60" />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="absolute inset-0 m-auto flex h-11 w-fit items-center gap-2 rounded-full bg-black/60 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75 disabled:cursor-wait"
        aria-label={isVideo ? "Unduh video" : "Unduh gambar"}
      >
        {downloadIcon}
        {sizeLabel && <span>{sizeLabel}</span>}
      </button>

      {isVideo && !media.isVideoNote && (
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white">
          <VideoIcon className="size-3" />
          Video
        </span>
      )}
    </div>
  );
}
