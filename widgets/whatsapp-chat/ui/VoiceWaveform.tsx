"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

import { Button } from "@/shared/ui/button";

export function VoiceWaveform({ audioUrl }: { audioUrl: string }) {
  const waveformReference = useRef<HTMLDivElement>(null);
  const playerReference = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  useEffect(() => {
    if (!waveformReference.current) {
      return;
    }

    setHasPlaybackError(false);

    const player = WaveSurfer.create({
      container: waveformReference.current,
      url: audioUrl,
      height: 40,
      waveColor: "#a7f3d0",
      progressColor: "#059669",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
    });

    playerReference.current = player;
    player.on("ready", (loadedDuration) => setDuration(loadedDuration));
    player.on("decode", (loadedDuration) => setDuration(loadedDuration));
    player.on("timeupdate", (time) => setCurrentTime(time));
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("finish", () => setIsPlaying(false));
    player.on("error", () => setHasPlaybackError(true));

    return () => {
      player.destroy();
      playerReference.current = null;
    };
  }, [audioUrl]);

  if (hasPlaybackError) {
    return (
      <audio
        controls
        preload="metadata"
        src={audioUrl}
        className="h-12 w-full min-w-64 max-w-full"
      >
        Browser tidak mendukung voice note ini.
      </audio>
    );
  }

  return (
    <div className="flex w-full min-w-64 max-w-full items-center gap-3 rounded-xl bg-black/15 p-3">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="rounded-full"
        onClick={() => void playerReference.current?.playPause()}
        aria-label={isPlaying ? "Jeda voice note" : "Putar voice note"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <div className="min-w-0 flex-1">
        <div
          ref={waveformReference}
          className="h-10 w-full min-w-40 overflow-hidden"
        />
        <div className="flex justify-between text-[11px] tabular-nums opacity-75">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
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
