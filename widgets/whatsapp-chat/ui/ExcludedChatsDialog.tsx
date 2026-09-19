"use client";

import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, UsersIcon, UserIcon } from "lucide-react";

import { useChatHistoryStore } from "@/entities/whatsapp-session";
import type { ExcludedChatSummary } from "@/entities/whatsapp-session";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Spinner } from "@/shared/ui/spinner";
import { cn } from "@/shared/lib/utils";

interface ExcludedChatsDialogProps {
  trigger?: React.ReactNode;
}

/**
 * Dialog untuk menampilkan daftar chat yang di-exclude/disembunyikan,
 * serta aksi untuk mengembalikan (un-exclude) percakapan tersebut.
 */
export function ExcludedChatsDialog({ trigger }: ExcludedChatsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unhidingJid, setUnhidingJid] = useState<string | null>(null);

  const {
    excludedChats,
    isLoadingExcludedChats,
    fetchExcludedChats,
    unhideConversation,
  } = useChatHistoryStore();

  useEffect(() => {
    if (isOpen) {
      void fetchExcludedChats();
    }
  }, [isOpen, fetchExcludedChats]);

  const handleUnhide = async (targetJid: string) => {
    setUnhidingJid(targetJid);

    try {
      await unhideConversation(targetJid);
    } finally {
      setUnhidingJid(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <EyeOffIcon className="size-3.5" />
            <span>Chat Tersembunyi</span>
            {excludedChats.length > 0 && (
              <span className="bg-muted text-muted-foreground ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold">
                {excludedChats.length}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOffIcon className="size-5" />
            <span>Chat Tersembunyi</span>
          </DialogTitle>

          <DialogDescription>
            Percakapan di bawah ini disembunyikan dari daftar chat dan media
            masuk tidak diunggah ke storage. Klik tombol untuk mengembalikannya.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-48">
          {isLoadingExcludedChats && excludedChats.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="text-muted-foreground size-6" />
            </div>
          ) : excludedChats.length === 0 ? (
            <div className="text-muted-foreground flex h-48 flex-col items-center justify-center gap-2 text-center text-sm">
              <EyeOffIcon className="text-muted-foreground/50 size-8" />
              <p>Tidak ada chat yang disembunyikan.</p>
            </div>
          ) : (
            <ScrollArea className="h-72 pr-2">
              <ul className="flex flex-col gap-2">
                {excludedChats.map((excludedChat) => (
                  <ExcludedChatItem
                    key={excludedChat.id}
                    excludedChat={excludedChat}
                    isUnhiding={unhidingJid === excludedChat.jid}
                    onUnhide={() => void handleUnhide(excludedChat.jid)}
                  />
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExcludedChatItem({
  excludedChat,
  isUnhiding,
  onUnhide,
}: {
  excludedChat: ExcludedChatSummary;
  isUnhiding: boolean;
  onUnhide: () => void;
}) {
  const isGroup = excludedChat.jid.endsWith("@g.us");
  const displayName =
    excludedChat.name || excludedChat.jid.split("@")[0] || "Kontak WhatsApp";

  return (
    <li className="bg-card border-border flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
          {isGroup ? (
            <UsersIcon className="size-4" />
          ) : (
            <UserIcon className="size-4" />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">
            {displayName}
          </span>

          <span className="text-muted-foreground truncate text-xs">
            {excludedChat.jid}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUnhiding}
        onClick={onUnhide}
        className="shrink-0 gap-1.5 text-xs hover:border-primary hover:text-primary"
      >
        {isUnhiding ? (
          <Spinner className="size-3.5" />
        ) : (
          <EyeIcon className="size-3.5" />
        )}
        <span>Tampilkan</span>
      </Button>
    </li>
  );
}
