"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  XIcon,
} from "lucide-react";

import {
  useChatHistoryStore,
  useStoryStore,
} from "@/entities/whatsapp-session";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";

interface ActiveStoryPosition {
  groupIndex: number;
  storyIndex: number;
}

const storyTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function StoryStrip() {
  const { activeSessionId, activeOwnerId } = useChatHistoryStore();
  const { groups, isLoading, errorMessage, fetchStories, markViewed, reset } =
    useStoryStore();
  const [activePosition, setActivePosition] =
    useState<ActiveStoryPosition | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const activeGroup = activePosition
    ? groups[activePosition.groupIndex]
    : undefined;
  const activeStory = activeGroup?.stories[activePosition?.storyIndex ?? -1];

  useEffect(() => {
    if (activeSessionId && activeOwnerId) {
      void fetchStories(activeSessionId, activeOwnerId);
    } else {
      reset();
    }
  }, [activeOwnerId, activeSessionId, fetchStories, reset]);

  const showStory = async (groupIndex: number, storyIndex: number) => {
    const story = groups[groupIndex]?.stories[storyIndex];

    if (!story) {
      return;
    }

    setActivePosition({ groupIndex, storyIndex });
    setIsDescriptionExpanded(false);

    if (!story.viewedAt && activeSessionId && activeOwnerId) {
      await markViewed(activeSessionId, activeOwnerId, story.id);
    }
  };

  const openStoryGroup = (groupIndex: number) => {
    const stories = groups[groupIndex]?.stories ?? [];
    const firstUnviewedIndex = stories.findIndex((story) => !story.viewedAt);
    const storyIndex = firstUnviewedIndex >= 0
      ? firstUnviewedIndex
      : Math.max(stories.length - 1, 0);

    void showStory(groupIndex, storyIndex);
  };

  const showPreviousStory = () => {
    if (!activePosition || activePosition.storyIndex === 0) {
      return;
    }

    void showStory(activePosition.groupIndex, activePosition.storyIndex - 1);
  };

  const showNextStory = () => {
    if (!activePosition || !activeGroup) {
      return;
    }

    if (activePosition.storyIndex === activeGroup.stories.length - 1) {
      setActivePosition(null);
      return;
    }

    void showStory(activePosition.groupIndex, activePosition.storyIndex + 1);
  };

  if (isLoading) {
    return <Spinner className="size-5" />;
  }

  if (errorMessage) {
    return <p className="text-destructive text-xs">{errorMessage}</p>;
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {groups.map((group, groupIndex) => (
          <Button
            key={group.senderJid}
            type="button"
            variant="ghost"
            onClick={() => openStoryGroup(groupIndex)}
            className="group h-auto w-16 shrink-0 flex-col gap-1.5 p-0"
          >
            <span className="relative">
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-full border-2 bg-emerald-500/10 text-sm font-bold",
                  group.hasUnviewed
                    ? "border-emerald-500 text-emerald-600"
                    : "border-muted text-muted-foreground",
                )}
              >
                {group.senderName.slice(0, 2).toUpperCase()}
              </span>
              {group.stories.some(
                (story) => !story.fromMe && story.likedBy.length > 0,
              ) && (
                <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] text-white">
                  ♥
                </span>
              )}
            </span>
            <span className="w-full truncate text-center text-[11px]">
              {group.senderName}
            </span>
          </Button>
        ))}
      </div>

      {activeStory && activeGroup && activePosition &&
        createPortal(
          <div className="fixed inset-0 z-100 grid place-items-center bg-black/85 p-4">
            <section className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-2xl">
              <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
                {activeGroup.stories.map((story, storyIndex) => (
                  <span
                    key={story.id}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      storyIndex <= activePosition.storyIndex
                        ? "bg-white"
                        : "bg-white/30",
                    )}
                  />
                ))}
              </div>

              <div className="absolute inset-x-3 top-7 z-20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {activeStory.senderName}
                  </p>
                  <p className="text-xs text-white/70">
                    {storyTimeFormatter.format(new Date(activeStory.sentAt))}
                    {" · "}
                    {activePosition.storyIndex + 1}/{activeGroup.stories.length}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActivePosition(null)}
                  className="shrink-0 text-white hover:bg-white/10 hover:text-white"
                  aria-label="Tutup story"
                >
                  <XIcon className="size-5" />
                </Button>
              </div>

              <div className="relative grid min-h-112 place-items-center pt-18">
                {activeStory.messageType === "image" &&
                activeStory.media &&
                "url" in activeStory.media ? (
                  <img
                    src={activeStory.media.url}
                    alt={activeStory.message || "Story WhatsApp"}
                    className="max-h-[70vh] w-full object-contain"
                  />
                ) : activeStory.messageType === "video" &&
                  activeStory.media &&
                  "url" in activeStory.media ? (
                  <video
                    key={activeStory.id}
                    src={activeStory.media.url}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-full"
                  />
                ) : activeStory.messageType === "audio" &&
                  activeStory.media &&
                  "url" in activeStory.media ? (
                  <div className="flex w-full flex-col items-center gap-6 px-10 py-24">
                    <div className="grid size-24 place-items-center rounded-full bg-emerald-500/20 text-4xl">
                      ♪
                    </div>
                    <audio
                      key={activeStory.id}
                      src={activeStory.media.url}
                      controls
                      autoPlay
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="grid min-h-96 w-full place-items-center bg-linear-to-br from-emerald-700 to-cyan-950 p-10 text-center text-2xl font-semibold">
                    {activeStory.message || "Story WhatsApp"}
                  </div>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={activePosition.storyIndex === 0}
                  onClick={showPreviousStory}
                  className="absolute left-2 top-1/2 rounded-full bg-black/35 text-white hover:bg-black/60 hover:text-white disabled:opacity-20"
                  aria-label="Story sebelumnya"
                >
                  <ChevronLeftIcon className="size-7" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={showNextStory}
                  className="absolute right-2 top-1/2 rounded-full bg-black/35 text-white hover:bg-black/60 hover:text-white"
                  aria-label="Story berikutnya"
                >
                  <ChevronRightIcon className="size-7" />
                </Button>
              </div>

              <footer className="flex items-end justify-between gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  {activeStory.message && (
                    <>
                      <p
                        className={cn(
                          "wrap-break-word whitespace-pre-wrap",
                          !isDescriptionExpanded && "line-clamp-2",
                        )}
                      >
                        {activeStory.message}
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        onClick={() =>
                          setIsDescriptionExpanded((isExpanded) => !isExpanded)
                        }
                        className="h-auto p-0 text-xs text-white/70"
                      >
                        {isDescriptionExpanded ? "Tutup deskripsi" : "Lihat selengkapnya"}
                      </Button>
                    </>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-zinc-400">
                  {activeStory.fromMe ? (
                    <>
                      <EyeIcon className="size-4" /> {activeStory.viewerCount}
                      {activeStory.likedBy.length > 0 && (
                        <span className="ml-2 text-rose-400">
                          ♥ {activeStory.likedBy.join(", ")}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <EyeIcon className="size-4" /> Dilihat di aplikasi
                    </>
                  )}
                </span>
              </footer>
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
