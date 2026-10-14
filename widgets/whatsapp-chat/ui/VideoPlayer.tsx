"use client";

import { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  mediaUrl: string;
  mimetype: string;
}

export function VideoPlayer({ mediaUrl, mimetype }: VideoPlayerProps) {
  const videoReference = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoReference.current;

    if (!video) {
      return;
    }

    const player = new Plyr(video, {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "settings",
        "fullscreen",
      ],
      settings: ["speed"],
      /**
       * Sprite ikon dimuat dari domain sendiri. Bawaan Plyr mengambilnya dari
       * cdn.plyr.io lewat XHR, yang diblokir `connect-src` pada CSP sehingga
       * tombol play, volume, dan layar penuh tampil kosong.
       */
      iconUrl: "/plyr.svg",
    });

    return () => player.destroy();
  }, []);

  return (
    <div className="max-w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoReference}
        playsInline
        preload="metadata"
        className="max-w-full"
      >
        <source src={mediaUrl} type={mimetype || "video/mp4"} />
        Browser tidak mendukung pemutaran video ini.
      </video>
    </div>
  );
}
