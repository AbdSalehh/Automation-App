"use client";

import { useRef, useState } from "react";
import { PlayIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

interface VideoNotePlayerProps {
  mediaUrl: string;
  mimetype: string;
}

/**
 * Pemutar video bulat ("video note") seperti di aplikasi WhatsApp: berbentuk
 * lingkaran tanpa kontrol, diputar/dijeda dengan sekali ketuk.
 */
export function VideoNotePlayer({ mediaUrl, mimetype }: VideoNotePlayerProps) {
  const videoReference = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlayback = () => {
    const video = videoReference.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  };

  return (
    <button
      type="button"
      onClick={handleTogglePlayback}
      aria-label={isPlaying ? "Jeda video" : "Putar video"}
      className="relative block size-56 shrink-0 overflow-hidden rounded-full bg-black focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none sm:size-64"
    >
      <video
        ref={videoReference}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="size-full object-cover"
      >
        <source src={mediaUrl} type={mimetype || "video/mp4"} />
      </video>

      <span
        className={cn(
          "absolute inset-0 grid place-items-center bg-black/25 transition-opacity",
          isPlaying ? "opacity-0" : "opacity-100",
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-black/50 text-white">
          <PlayIcon className="size-5 fill-current" />
        </span>
      </span>
    </button>
  );
}
