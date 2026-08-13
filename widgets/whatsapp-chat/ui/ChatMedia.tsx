"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  MapPinIcon,
} from "lucide-react";

import { useLinkPreviewStore } from "@/entities/link-preview";
import type { ChatMessage } from "@/entities/whatsapp-session";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { LocationMap } from "./LocationMap";
import { VideoPlayer } from "./VideoPlayer";
import { VoiceWaveform } from "./VoiceWaveform";

export function ChatMedia({ message }: { message: ChatMessage }) {
  if (message.messageType === "location") {
    return <LocationPreview message={message} />;
  }

  const media = message.media;

  if (!media || !("mimetype" in media)) {
    return null;
  }

  if (message.messageType === "image") {
    return <ImagePreview media={media} />;
  }

  if (message.messageType === "sticker") {
    return (
      <Image
        src={media.url}
        alt={media.fileName || "Stiker"}
        width={240}
        height={240}
        className="max-h-72 max-w-full rounded-lg object-contain"
        unoptimized
      />
    );
  }

  if (message.messageType === "audio") {
    return <VoiceWaveform audioUrl={media.url} />;
  }

  if (message.messageType === "video") {
    return <VideoPlayer mediaUrl={media.url} mimetype={media.mimetype} />;
  }

  return <DocumentPreview media={media} />;
}

export function LinkPreview({ message }: { message: string }) {
  const link = getFirstLink(message);
  const { metadataByUrl, loadingByUrl, loadPreview } = useLinkPreviewStore();
  const metadata = link ? metadataByUrl[link] : null;
  const isLoading = link ? loadingByUrl[link] : false;

  useEffect(() => {
    if (link) {
      void loadPreview(link);
    }
  }, [link, loadPreview]);

  if (!link) {
    return null;
  }

  const url = new URL(link);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-full min-w-0 overflow-hidden rounded-xl border border-current/15 bg-black/10 transition-colors hover:bg-black/15"
    >
      {metadata?.imageUrl ? (
        <Image
          src={metadata.imageUrl}
          alt=""
          width={640}
          height={320}
          unoptimized
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex min-h-24 items-end bg-[radial-gradient(circle_at_75%_18%,rgba(255,255,255,0.2),transparent_32%),linear-gradient(135deg,rgba(16,185,129,0.45),rgba(15,23,42,0.8))] p-3">
          <span className="rounded-full bg-black/25 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
            {url.hostname.replace("www.", "")}
          </span>
        </div>
      )}
      <div className="space-y-1 px-3 py-2.5">
        <p className="line-clamp-2 text-sm font-semibold">
          {metadata?.title ?? (isLoading ? "Memuat preview..." : url.hostname)}
        </p>
        {metadata?.description && (
          <p className="line-clamp-2 text-xs opacity-75">
            {metadata.description}
          </p>
        )}
        <p className="line-clamp-1 text-[11px] opacity-65">
          {metadata?.siteName ?? url.hostname}
        </p>
      </div>
    </a>
  );
}

function LocationPreview({ message }: { message: ChatMessage }) {
  const location = message.media;

  if (
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
      className="block overflow-hidden rounded-xl bg-black/12 transition-transform hover:scale-[1.01]"
    >
      <LocationMap
        latitude={location.latitude}
        longitude={location.longitude}
      />
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/20">
          <MapPinIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {location.name || "Lokasi dibagikan"}
          </p>
          <p className="truncate text-xs opacity-75">
            {location.address || `${location.latitude}, ${location.longitude}`}
          </p>
        </div>
        <ExternalLinkIcon className="ml-auto size-4 shrink-0 opacity-70" />
      </div>
    </a>
  );
}

function ImagePreview({
  media,
}: {
  media: Extract<NonNullable<ChatMessage["media"]>, { mimetype: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="block overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
        onClick={() => setIsOpen(true)}
        aria-label="Buka gambar ukuran penuh"
      >
        <Image
          src={media.url}
          alt={media.fileName || "Gambar"}
          width={360}
          height={360}
          className="max-h-80 max-w-full rounded-lg object-cover transition-transform hover:scale-[1.02]"
          unoptimized
        />
      </button>
      <ImageViewer
        imageUrl={media.url}
        imageName={media.fileName || "Gambar"}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}

function ImageViewer({
  imageUrl,
  imageName,
  isOpen,
  onOpenChange,
}: {
  imageUrl: string;
  imageName: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const touchDistanceReference = useRef<number | null>(null);
  const [scale, setScale] = useState(1);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      touchDistanceReference.current = getTouchDistance(event.touches);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !touchDistanceReference.current) {
      return;
    }

    const touchDistance = getTouchDistance(event.touches);
    const nextScale = Math.min(
      4,
      Math.max(1, scale * (touchDistance / touchDistanceReference.current)),
    );

    touchDistanceReference.current = touchDistance;
    setScale(nextScale);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="h-dvh max-w-none! border-0 bg-black/95 p-0 sm:max-w-none!"
      >
        <DialogTitle className="sr-only">{imageName}</DialogTitle>
        <div
          className="flex h-full w-full touch-none items-center justify-center overflow-hidden"
          onDoubleClick={() => setScale(1)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => {
            touchDistanceReference.current = null;
          }}
        >
          <Image
            src={imageUrl}
            alt={imageName}
            width={1600}
            height={1600}
            unoptimized
            className="max-h-full max-w-full object-contain transition-transform duration-150 select-none"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentPreview({
  media,
}: {
  media: Extract<NonNullable<ChatMessage["media"]>, { mimetype: string }>;
}) {
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

function getFirstLink(message: string): string | null {
  return message.match(/https?:\/\/[^\s<]+/i)?.[0] ?? null;
}

function getTouchDistance(touches: React.TouchList): number {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}
