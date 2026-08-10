"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  MessageCircleIcon,
  CheckCircle2Icon,
  SmartphoneIcon,
} from "lucide-react";

import { useWhatsappSessionStore } from "@/entities/whatsapp-session";
import { Button, Spinner, Badge } from "@/shared/ui";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";

/**
 * Kartu untuk menautkan WhatsApp (Baileys). Menampilkan tombol "Tautkan
 * WhatsApp" yang membuka alert-dialog berisi QR code. Bila sesi sudah
 * tersambung, kartu menampilkan status tersambung dan tombol dikunci sampai
 * pengguna melepas tautan perangkat dari aplikasi WhatsApp di ponsel.
 */
export function WhatsappLinkCard() {
  const {
    status,
    qrDataUrl,
    isReady,
    pendingDuplicate,
    isPolling,
    isResolvingDuplicate,
    duplicateErrorMessage,
    isCreatingSession,
    createSessionErrorMessage,
    sessions,
    sessionId,
    pollSessionStatus,
    loadSessions,
    createSession,
    confirmDuplicate,
    cancelDuplicate,
    subscribeSession,
    unsubscribeSession,
  } = useWhatsappSessionStore();

  const hasConnectedSessions = sessions.some(
    (whatsappSession) => whatsappSession.isReady,
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddAccount = async () => {
    const wasCreated = await createSession();

    if (wasCreated) {
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    void pollSessionStatus();
    void loadSessions();
  }, [loadSessions, pollSessionStatus]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    subscribeSession(sessionId);
    void pollSessionStatus();

    return () => {
      unsubscribeSession();
    };
  }, [sessionId, pollSessionStatus, subscribeSession, unsubscribeSession]);

  /**
   * Tutup dialog otomatis begitu sesi berhasil tersambung agar pengguna tidak
   * perlu menutupnya manual.
   */
  useEffect(() => {
    if (isReady && !pendingDuplicate && isDialogOpen) {
      const timeout = setTimeout(() => setIsDialogOpen(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isReady, pendingDuplicate, isDialogOpen]);

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <MessageCircleIcon className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-foreground text-sm font-semibold">
              WhatsApp Account (Baileys)
            </h3>
            <p className="text-muted-foreground text-xs">
              Link WhatsApp to use the WhatsApp node inside your workflows.
            </p>
          </div>
        </div>

        {hasConnectedSessions ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2Icon className="size-3" />
            {
              sessions.filter((whatsappSession) => whatsappSession.isReady)
                .length
            }{" "}
            Connected
          </Badge>
        ) : (
          <Badge variant="neutral">Not linked</Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {sessions
          .filter((whatsappSession) => whatsappSession.isReady)
          .map((whatsappSession) => (
            <div
              key={whatsappSession.sessionId}
              className="flex min-w-60 flex-1 items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4"
            >
              <SmartphoneIcon className="size-5 shrink-0 text-emerald-600" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-emerald-700">
                  {whatsappSession.name || "WhatsApp Account"}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {whatsappSession.phoneNumber || "Connected"}
                </span>
              </div>
            </div>
          ))}

        {hasConnectedSessions ? (
          <Button
            type="button"
            variant="outline"
            disabled={isCreatingSession}
            onClick={() => void handleAddAccount()}
            className="h-auto min-h-18 min-w-60 flex-1 justify-start gap-3 p-4"
          >
            {isCreatingSession ? (
              <Spinner className="size-5" />
            ) : (
              <MessageCircleIcon className="size-5" />
            )}
            <span className="flex flex-col items-start">
              <span>Add WhatsApp Account</span>
              <span className="text-muted-foreground text-xs font-normal">
                Link another account
              </span>
            </span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="w-fit gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <MessageCircleIcon className="size-4" />
            Link WhatsApp
          </Button>
        )}
      </div>

      {createSessionErrorMessage && (
        <p className="text-destructive text-xs">{createSessionErrorMessage}</p>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Link WhatsApp</AlertDialogTitle>
            <AlertDialogDescription>
              Open WhatsApp on your phone, go to Linked Devices, then scan the
              code below. If this number is already connected elsewhere, you
              will be asked before its previous session is logged out.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {pendingDuplicate ? (
              <div className="border-warning/30 bg-warning/5 flex w-full flex-col gap-3 rounded-xl border p-4">
                <p className="text-foreground text-sm font-semibold">
                  Nomor {pendingDuplicate.phoneNumber} sudah terhubung
                </p>
                <p className="text-muted-foreground text-xs">
                  Melanjutkan akan logout sesi lama berikut:
                </p>
                <ul className="text-muted-foreground list-inside list-disc text-xs">
                  {pendingDuplicate.conflictingSessionIds.map(
                    (conflictingSessionId) => (
                      <li key={conflictingSessionId}>{conflictingSessionId}</li>
                    ),
                  )}
                </ul>
                {duplicateErrorMessage && (
                  <p className="text-destructive text-xs">
                    {duplicateErrorMessage}
                  </p>
                )}
              </div>
            ) : isReady ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle2Icon className="size-16 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-600">
                  WhatsApp linked successfully!
                </p>
              </div>
            ) : qrDataUrl ? (
              <div className="border-border rounded-xl border bg-white p-4 shadow-sm">
                <Image
                  src={qrDataUrl}
                  alt="WhatsApp QR code"
                  width={264}
                  height={264}
                  unoptimized
                />
              </div>
            ) : (
              <div className="border-border bg-muted/30 flex size-66 flex-col items-center justify-center gap-3 rounded-xl border">
                <Spinner className="text-muted-foreground size-8" />
                <p className="text-muted-foreground text-xs">
                  {isPolling
                    ? "Loading session status..."
                    : "Preparing QR code..."}
                </p>
              </div>
            )}

            <p className="text-muted-foreground text-center text-xs">
              Status:{" "}
              <span className="text-foreground font-medium">{status}</span>
            </p>
          </div>

          <AlertDialogFooter>
            {pendingDuplicate ? (
              <>
                <AlertDialogCancel
                  disabled={isResolvingDuplicate}
                  onClick={() => void cancelDuplicate()}
                >
                  Batalkan
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isResolvingDuplicate}
                  onClick={(mouseEvent) => {
                    mouseEvent.preventDefault();
                    void confirmDuplicate();
                  }}
                >
                  {isResolvingDuplicate ? "Memproses..." : "Lanjutkan"}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogCancel>Close</AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
