"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  CircleDashedIcon,
  MenuIcon,
  MessageCircleIcon,
  SmartphoneIcon,
  XIcon,
} from "lucide-react";

import {
  useChatHistoryStore,
  type WhatsappSessionSummary,
} from "@/entities/whatsapp-session";
import { ConversationList } from "@/widgets/whatsapp-chat/ui/ConversationList";
import { ChatHistoryPanel } from "@/widgets/whatsapp-chat/ui/ChatHistoryPanel";
import { StoryStrip } from "@/widgets/whatsapp-chat/ui/StoryStrip";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";

export function WhatsappSessionsView() {
  const {
    sessions,
    activeSessionId,
    activeJid,
    isLoadingSessions,
    errorMessage,
    fetchSessions,
    selectSession,
    reset,
  } = useChatHistoryStore();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [mobileNavigationStep, setMobileNavigationStep] = useState<
    "sessions" | "conversations"
  >("sessions");

  useEffect(() => {
    void fetchSessions();

    return () => reset();
  }, [fetchSessions, reset]);

  const handleSelectSession = async (
    whatsappSession: WhatsappSessionSummary,
  ) => {
    await selectSession(whatsappSession);
    setMobileNavigationStep("conversations");
    setIsNavigationOpen(true);
  };

  const handleOpenNavigation = () => {
    setMobileNavigationStep(activeSessionId ? "conversations" : "sessions");
    setIsNavigationOpen(true);
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
      <header className="border-border bg-card relative overflow-hidden rounded-2xl border p-5 sm:p-6">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 sm:size-12">
            <MessageCircleIcon className="size-5 sm:size-6" />
          </div>
          <div>
            <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              WhatsApp Sessions
            </h1>
            <p className="text-muted-foreground text-sm">
              Lihat sesi, percakapan aktif, dan seluruh riwayat pesan tersimpan.
            </p>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          {errorMessage}
        </div>
      )}

      <section className="border-border bg-card hidden h-[calc(100dvh-4rem)] max-h-208 min-h-160 overflow-hidden rounded-2xl border lg:grid lg:grid-cols-[240px_300px_minmax(0,1fr)]">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoadingSessions={isLoadingSessions}
          onSelectSession={handleSelectSession}
        />
        <ConversationPane activeSessionId={activeSessionId} />
        <ChatPane />
      </section>

      <section className="border-border bg-card relative flex h-[calc(100dvh-8rem)] max-h-[calc(100dvh-8rem)] min-h-96 flex-col overflow-hidden rounded-2xl border lg:hidden">
        <div className="border-border flex shrink-0 items-center gap-2 border-b p-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleOpenNavigation}
            aria-label="Buka daftar sesi dan percakapan"
          >
            <MenuIcon />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {activeJid ? "Riwayat chat" : "WhatsApp"}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {activeSessionId
                ? activeJid
                  ? "Percakapan aktif"
                  : "Pilih percakapan"
                : "Pilih sesi WhatsApp terlebih dahulu"}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-2">
          {activeJid ? (
            <ChatHistoryPanel />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
              {activeSessionId
                ? "Pilih percakapan dari sidebar untuk melihat riwayat chat."
                : "Buka sidebar dan pilih sesi WhatsApp terlebih dahulu."}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Tutup sidebar navigasi"
          onClick={() => setIsNavigationOpen(false)}
          className={cn(
            "absolute inset-0 z-40 bg-black/45 transition-opacity duration-300",
            isNavigationOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        />

        <aside
          className={cn(
            "border-border bg-card absolute inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col overflow-hidden border-r shadow-2xl transition-transform duration-300 ease-out",
            isNavigationOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!isNavigationOpen}
        >
          <div className="border-border flex shrink-0 items-center gap-2 border-b p-3">
            {mobileNavigationStep === "conversations" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavigationStep("sessions")}
                aria-label="Kembali ke daftar sesi"
              >
                <ArrowLeftIcon />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {mobileNavigationStep === "sessions"
                  ? "Pilih sesi"
                  : "Pilih percakapan"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {mobileNavigationStep === "sessions"
                  ? "Sesi WhatsApp tersedia"
                  : "Percakapan dari sesi terpilih"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsNavigationOpen(false)}
              aria-label="Tutup sidebar"
            >
              <XIcon />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileNavigationStep === "sessions" ? (
              <SessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                isLoadingSessions={isLoadingSessions}
                onSelectSession={(whatsappSession) => {
                  void handleSelectSession(whatsappSession);
                }}
              />
            ) : (
              <ConversationPane
                activeSessionId={activeSessionId}
                onConversationOpened={() => setIsNavigationOpen(false)}
              />
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

function SessionList({
  sessions,
  activeSessionId,
  isLoadingSessions,
  onSelectSession,
}: {
  sessions: WhatsappSessionSummary[];
  activeSessionId: string | null;
  isLoadingSessions: boolean;
  onSelectSession: (whatsappSession: WhatsappSessionSummary) => void;
}) {
  return (
    <aside className="border-border flex h-full min-h-0 flex-col overflow-hidden border-b p-3 lg:border-r lg:border-b-0">
      <h2 className="text-muted-foreground shrink-0 px-2 pb-3 text-xs font-semibold tracking-wider uppercase">
        Sessions
      </h2>
      {isLoadingSessions ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-5" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground px-2 py-6 text-center text-sm">
          Belum ada sesi WhatsApp.
        </p>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col gap-1">
            {sessions.map((whatsappSession) => (
              <li key={whatsappSession.sessionId}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectSession(whatsappSession)}
                  className={cn(
                    "h-auto w-full justify-start gap-3 rounded-lg p-2.5 text-left",
                    activeSessionId === whatsappSession.sessionId &&
                      "bg-accent",
                  )}
                >
                  <SmartphoneIcon className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate text-sm font-medium">
                      {whatsappSession.name ||
                        whatsappSession.phoneNumber ||
                        whatsappSession.sessionId}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {whatsappSession.phoneNumber || whatsappSession.sessionId}
                    </span>
                  </span>
                  <Badge
                    variant={whatsappSession.isReady ? "success" : "neutral"}
                  >
                    {whatsappSession.status}
                  </Badge>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </aside>
  );
}

function ConversationPane({
  activeSessionId,
  onConversationOpened,
}: {
  activeSessionId: string | null;
  onConversationOpened?: () => void;
}) {
  const [isShowingStories, setIsShowingStories] = useState(false);

  if (!activeSessionId) {
    return (
      <div className="text-muted-foreground flex min-h-52 items-center justify-center p-5 text-center text-sm">
        Pilih sesi WhatsApp untuk menampilkan daftar percakapan.
      </div>
    );
  }

  return (
    <div className="border-border flex h-full min-h-0 flex-col overflow-hidden border-b p-3 lg:border-r lg:border-b-0">
      <div className="border-border shrink-0 border-b pb-3">
        <Button
          type="button"
          variant={isShowingStories ? "secondary" : "outline"}
          onClick={() => setIsShowingStories((isShowing) => !isShowing)}
          className="w-full justify-start gap-2"
        >
          <CircleDashedIcon className="size-4" />
          {isShowingStories ? "Kembali ke percakapan" : "Lihat story"}
        </Button>
      </div>
      <div className="min-h-0 flex-1 pt-3">
        {isShowingStories ? (
          <ScrollArea className="h-full">
            <StoryStrip variant="list" />
          </ScrollArea>
        ) : (
          <ConversationList onConversationOpened={onConversationOpened} />
        )}
      </div>
    </div>
  );
}

function ChatPane() {
  return (
    <div className="h-full min-h-0 overflow-hidden p-3">
      <ChatHistoryPanel />
    </div>
  );
}
