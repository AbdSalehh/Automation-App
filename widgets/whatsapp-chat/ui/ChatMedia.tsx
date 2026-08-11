"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  MapPinIcon,
  PauseIcon,
  PlayIcon,
  Volume2Icon,
} from "lucide-react";

import type { ChatMessage } from "@/entities/whatsapp-session";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

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
        className="max-h-72 rounded-lg object-contain"
        unoptimized
      />
    );
  }

  if (message.messageType === "audio") {
    return <VoiceNote media={media} />;
  }

  if (message.messageType === "video") {
    return <VideoPreview media={media} />;
  }

  return <DocumentPreview media={media} />;
}

export function LinkPreview({ message }: { message: string }) {
  const link = getFirstLink(message);

  if (!link) {
    return null;
  }

  const url = new URL(link);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block min-w-0 max-w-full overflow-hidden rounded-xl border border-current/15 bg-black/10 transition-colors hover:bg-black/15"
    >
      <div className="flex min-h-28 items-end bg-[radial-gradient(circle_at_75%_18%,rgba(255,255,255,0.2),transparent_32%),linear-gradient(135deg,rgba(16,185,129,0.45),rgba(15,23,42,0.8))] p-3">
        <span className="rounded-full bg-black/25 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
          {url.hostname.replace("www.", "")}
        </span>
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <p className="line-clamp-1 text-sm font-semibold">
          {getLinkTitle(url)}
        </p>
        <p className="line-clamp-1 text-xs opacity-75">{url.hostname}</p>
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
      <div className="relative h-36 overflow-hidden bg-[linear-gradient(30deg,transparent_47%,rgba(255,255,255,0.12)_48%,transparent_49%),linear-gradient(145deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.28)_1px,transparent_1px)] bg-size-[34px_34px] opacity-45" />
        <div className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-rose-500 text-white shadow-lg after:absolute after:-bottom-2 after:size-5 after:rotate-45 after:rounded-sm after:bg-rose-500">
          <MapPinIcon className="relative z-10 size-6" />
        </div>
        <span className="absolute bottom-2 left-3 text-sm font-bold tracking-tight text-white/90">
          MAP
        </span>
      </div>
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

function VoiceNote({
  media,
}: {
  media: Extract<NonNullable<ChatMessage["media"]>, { mimetype: string }>;
}) {
  const audioReference = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlayback = async () => {
    const audio = audioReference.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
      return;
    }

    audio.pause();
  };

  return (
    <div className="flex min-w-64 items-center gap-3 rounded-xl bg-black/15 p-3">
      <audio
        ref={audioReference}
        src={media.url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="rounded-full"
        onClick={() => void togglePlayback()}
        aria-label={isPlaying ? "Jeda voice note" : "Putar voice note"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex h-7 items-center gap-0.5 overflow-hidden opacity-70">
          <span className="h-3 w-full rounded-full bg-current mask-[repeating-linear-gradient(90deg,#000_0_2px,transparent_2px_4px)]" />
        </div>
        <div className="flex justify-between text-[11px] tabular-nums opacity-75">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <Volume2Icon className="size-4 shrink-0 opacity-75" />
    </div>
  );
}

function VideoPreview({
  media,
}: {
  media: Extract<NonNullable<ChatMessage["media"]>, { mimetype: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-black/20">
      <video controls preload="metadata" className="max-h-96 w-full bg-black">
        <source src={media.url} type={media.mimetype || "video/mp4"} />
        Browser tidak mendukung pemutaran video ini.
      </video>
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-xs opacity-80 hover:opacity-100"
      >
        <DownloadIcon className="size-3.5" />
        Unduh video
      </a>
    </div>
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
          className="max-h-80 rounded-lg object-cover transition-transform hover:scale-[1.02]"
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

function getLinkTitle(url: URL): string {
  if (url.hostname.includes("instagram.com")) {
    return "Tautan Instagram";
  }

  return `Tautan dari ${url.hostname.replace("www.", "")}`;
}

function getTouchDistance(touches: React.TouchList): number {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

function formatDuration(duration: number): string {
  if (!Number.isFinite(duration)) {
    return "0:00";
  }

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
