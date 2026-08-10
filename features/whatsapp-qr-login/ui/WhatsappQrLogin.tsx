"use client";

import { useEffect } from "react";
import Image from "next/image";

import { useWhatsappSessionStore } from "@/entities/whatsapp-session";
import { Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

/**
 * Menampilkan QR code untuk menautkan WhatsApp ke service Baileys. Status sesi
 * diambil sekali di awal, lalu perubahan (QR/koneksi) diterima realtime lewat
 * Ably tanpa polling berulang.
 */
export const WhatsappQrLogin = () => {
  const {
    status,
    qrDataUrl,
    isReady,
    isPolling,
    sessionId,
    pollSessionStatus,
    subscribeSession,
    unsubscribeSession,
  } = useWhatsappSessionStore();

  useEffect(() => {
    void pollSessionStatus();
  }, [pollSessionStatus]);

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

  return (
    <div className="border-border bg-card flex flex-col items-center gap-4 rounded-xl border p-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-foreground text-lg font-semibold">
          Connect WhatsApp (Baileys)
        </h2>

        <p className="text-muted-foreground text-xs">
          Status: <span className="text-foreground font-medium">{status}</span>
        </p>
      </div>

      {isReady && (
        <p className="text-sm font-medium text-green-600">
          WhatsApp is connected
        </p>
      )}

      {!isReady && qrDataUrl && (
        <div
          className={cn(
            "border-border rounded-xl border p-4 shadow-sm",
            "bg-white transition-all",
          )}
        >
          <Image
            src={qrDataUrl}
            alt="WhatsApp QR code"
            width={264}
            height={264}
            unoptimized
          />
        </div>
      )}

      {!isReady && !qrDataUrl && (
        <div className="border-border bg-muted/30 flex size-66 flex-col items-center justify-center gap-3 rounded-xl border">
          <Spinner className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-xs">
            {isPolling ? "Loading session status..." : "Preparing QR code..."}
          </p>
        </div>
      )}

      <p className="text-muted-foreground max-w-xs text-center text-xs">
        Open WhatsApp on your phone, go to Linked Devices, then scan the code
        above.
      </p>
    </div>
  );
};
