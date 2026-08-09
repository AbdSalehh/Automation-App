"use client";

import { useEffect } from "react";
import { MessageCircleIcon, SmartphoneIcon } from "lucide-react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
import { ConversationList } from "@/widgets/whatsapp-chat/ui/ConversationList";
import { ChatHistoryPanel } from "@/widgets/whatsapp-chat/ui/ChatHistoryPanel";
import { Badge } from "@/shared/ui/Badge";
import { Spinner } from "@/shared/ui/spinner";
import { ScrollArea } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

export function WhatsappSessionsView() {
  const {
    sessions,
    activeSessionId,
    isLoadingSessions,
    errorMessage,
    fetchSessions,
    selectSession,
    reset,
  } = useChatHistoryStore();

  useEffect(() => {
    fetchSessions();

    return () => reset();
  }, [fetchSessions, reset]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="border-border bg-card relative overflow-hidden rounded-2xl border p-6">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <MessageCircleIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight">
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

      <section className="border-border bg-card grid min-h-160 overflow-hidden rounded-2xl border lg:grid-cols-[240px_300px_1fr]">
        <aside className="border-border border-b p-3 lg:border-r lg:border-b-0">
          <h2 className="text-muted-foreground px-2 pb-3 text-xs font-semibold tracking-wider uppercase">
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
            <ul className="flex flex-col gap-1">
              {sessions.map((whatsappSession) => (
                <li key={whatsappSession.sessionId}>
                  <button
                    type="button"
                    onClick={() => selectSession(whatsappSession)}
                    className={cn(
                      "hover:bg-accent flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors",
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
                        {whatsappSession.phoneNumber ||
                          whatsappSession.sessionId}
                      </span>
                    </span>
                    <Badge
                      variant={whatsappSession.isReady ? "success" : "neutral"}
                    >
                      {whatsappSession.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="border-border min-h-80 overflow-hidden border-b p-3 lg:border-r lg:border-b-0">
          {activeSessionId ? (
            <ConversationList />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
              Pilih sesi WhatsApp.
            </div>
          )}
        </div>

        <div className="min-h-96 overflow-hidden p-3">
          <ScrollArea className="h-150">
            <ChatHistoryPanel />
          </ScrollArea>
        </div>
      </section>
    </main>
  );
}
