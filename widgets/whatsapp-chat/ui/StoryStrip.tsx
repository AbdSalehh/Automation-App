"use client";

import { useEffect, useState } from "react";
import { EyeIcon, XIcon } from "lucide-react";

import {
  useChatHistoryStore,
  useStoryStore,
} from "@/entities/whatsapp-session";
import type { WhatsappStory } from "@/entities/whatsapp-session";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";

export function StoryStrip() {
  const { activeSessionId, activeOwnerId } = useChatHistoryStore();
  const { groups, isLoading, errorMessage, fetchStories, markViewed, reset } =
    useStoryStore();
  const [activeStory, setActiveStory] = useState<WhatsappStory | null>(null);

  useEffect(() => {
    if (activeSessionId && activeOwnerId) {
      fetchStories(activeSessionId, activeOwnerId);
    } else {
      reset();
    }
  }, [activeOwnerId, activeSessionId, fetchStories, reset]);

  const openStory = async (story: WhatsappStory) => {
    setActiveStory(story);

    if (!story.viewedAt && activeSessionId && activeOwnerId) {
      await markViewed(activeSessionId, activeOwnerId, story.id);
    }
  };

  if (isLoading) {
    return <Spinner className="size-5" />;
  }

  if (errorMessage) {
    return <p className="text-destructive text-xs">{errorMessage}</p>;
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {groups.map((group) => {
          const latestStory = group.stories[group.stories.length - 1];

          return (
            <button
              key={group.senderJid}
              type="button"
              onClick={() => latestStory && openStory(latestStory)}
              className="group flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
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
              <span className="w-full truncate text-center text-[11px]">
                {group.senderName}
              </span>
            </button>
          );
        })}
      </div>

      {activeStory && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4">
          <section className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-2xl">
            <Button
              variant="ghost"
              onClick={() => setActiveStory(null)}
              className="absolute top-3 right-3 z-10 text-white"
              aria-label="Tutup story"
            >
              <XIcon className="size-5" />
            </Button>
            {activeStory.messageType === "image" &&
            activeStory.media &&
            "url" in activeStory.media ? (
              <img
                src={activeStory.media.url}
                alt={activeStory.message || "Story WhatsApp"}
                className="max-h-[75vh] w-full object-contain"
              />
            ) : activeStory.messageType === "video" &&
              activeStory.media &&
              "url" in activeStory.media ? (
              <video
                src={activeStory.media.url}
                controls
                autoPlay
                className="max-h-[75vh] w-full"
              />
            ) : (
              <div className="grid min-h-96 place-items-center bg-linear-to-br from-emerald-700 to-cyan-950 p-10 text-center text-2xl font-semibold">
                {activeStory.message || "Story WhatsApp"}
              </div>
            )}
            <footer className="flex items-center justify-between p-4 text-sm">
              <strong>{activeStory.senderName}</strong>
              <span className="flex items-center gap-1 text-zinc-400">
                <EyeIcon className="size-4" /> Dilihat di aplikasi
              </span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
