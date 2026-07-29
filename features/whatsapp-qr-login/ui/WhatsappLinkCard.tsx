"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
    isPolling,
    pollSessionStatus,
    subscribeSession,
    unsubscribeSession,
  } = useWhatsappSessionStore();

  const { data: session } = useSession();
  const sessionId = session?.user?.id ?? "";

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    pollSessionStatus();
    subscribeSession(sessionId);

    return () => {
      unsubscribeSession();
    };
  }, [sessionId, pollSessionStatus, subscribeSession, unsubscribeSession]);

  /**
   * Tutup dialog otomatis begitu sesi berhasil tersambung agar pengguna tidak
   * perlu menutupnya manual.
   */
  useEffect(() => {
    if (isReady && isDialogOpen) {
      const timeout = setTimeout(() => setIsDialogOpen(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [isReady, isDialogOpen]);

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

        {isReady ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2Icon className="size-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="neutral">Not linked</Badge>
        )}
      </div>

      {isReady ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
          <SmartphoneIcon className="size-5 text-emerald-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-emerald-700">
              WhatsApp is linked
            </span>
            <span className="text-muted-foreground text-xs">
              To re-link, remove this device from the Linked Devices menu in the
              WhatsApp app on your phone.
            </span>
          </div>
        </div>
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

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Link WhatsApp</AlertDialogTitle>
            <AlertDialogDescription>
              Open WhatsApp on your phone, go to Linked Devices, then scan the
              code below. If this number is connected to another account, its
              previous session will be logged out automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {isReady ? (
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
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
