"use client";

import { useEffect, useState } from "react";
import { MenuIcon, MessageCircleIcon, SmartphoneIcon } from "lucide-react";

import {
  useChatHistoryStore,
  type WhatsappSessionSummary,
} from "@/entities/whatsapp-session";
import { ConversationList } from "@/widgets/whatsapp-chat/ui/ConversationList";
import { ChatHistoryPanel } from "@/widgets/whatsapp-chat/ui/ChatHistoryPanel";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
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

  useEffect(() => {
    void fetchSessions();

    return () => reset();
  }, [fetchSessions, reset]);

  const handleSelectSession = (whatsappSession: WhatsappSessionSummary) => {
    void selectSession(whatsappSession);
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

      <section className="border-border bg-card hidden h-160 min-h-0 overflow-hidden rounded-2xl border lg:grid lg:grid-cols-[240px_300px_1fr]">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoadingSessions={isLoadingSessions}
          onSelectSession={handleSelectSession}
        />
        <ConversationPane activeSessionId={activeSessionId} />
        <ChatPane />
      </section>

      <section className="border-border bg-card flex min-h-[calc(100dvh-15rem)] flex-1 flex-col overflow-hidden rounded-2xl border lg:hidden">
        <div className="border-border flex items-center gap-2 border-b p-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsNavigationOpen(true)}
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
                ? "Pilih percakapan dari menu"
                : "Pilih sesi WhatsApp terlebih dahulu"}
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 p-2">
          <ChatHistoryPanel />
        </div>
      </section>

      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent
          side="left"
          className="h-dvh w-[88vw] max-w-sm gap-0 overflow-hidden p-0"
        >
          <SheetHeader className="border-border border-b px-5 py-4">
            <SheetTitle>Sesi & Percakapan</SheetTitle>
            <SheetDescription>
              Pilih sesi WhatsApp sebelum membuka percakapan.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              isLoadingSessions={isLoadingSessions}
              onSelectSession={handleSelectSession}
            />
            <ConversationPane
              activeSessionId={activeSessionId}
              onConversationOpened={() => setIsNavigationOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
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
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {sessions.map((whatsappSession) => (
            <li key={whatsappSession.sessionId}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelectSession(whatsappSession)}
                className={cn(
                  "h-auto w-full justify-start gap-3 rounded-lg p-2.5 text-left",
                  activeSessionId === whatsappSession.sessionId && "bg-accent",
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
  if (!activeSessionId) {
    return (
      <div className="text-muted-foreground flex min-h-52 items-center justify-center p-5 text-center text-sm">
        Pilih sesi WhatsApp untuk menampilkan daftar percakapan.
      </div>
    );
  }

  return (
    <div className="border-border h-full min-h-0 overflow-hidden border-b p-3 lg:border-r lg:border-b-0">
      <ConversationList onConversationOpened={onConversationOpened} />
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
