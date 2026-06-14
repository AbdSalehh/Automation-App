"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { useWhatsappSessionStore } from "@/entities/whatsapp-session";
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
    pollSessionStatus,
    subscribeSession,
    unsubscribeSession,
  } = useWhatsappSessionStore();

  const { data: session } = useSession();

  const sessionId = session?.user?.id ?? "";

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    /** Fetch awal sekali untuk state saat halaman dibuka. */
    pollSessionStatus();

    subscribeSession(sessionId);

    return () => {
      unsubscribeSession();
    };
  }, [sessionId, pollSessionStatus, subscribeSession, unsubscribeSession]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          Hubungkan WhatsApp (Baileys)
        </h2>

        <p className="text-xs text-muted-foreground">
          Status: <span className="font-medium text-foreground">{status}</span>
        </p>
      </div>

      {isReady && (
        <p className="text-sm font-medium text-green-600">
          WhatsApp sudah tersambung
        </p>
      )}

      {!isReady && qrDataUrl && (
        <div
          className={cn(
            "rounded-xl border border-border p-4 shadow-sm",
            "bg-white transition-all",
          )}
        >
          <Image
            src={qrDataUrl}
            alt="QR code WhatsApp"
            width={264}
            height={264}
            unoptimized
          />
        </div>
      )}

      {!isReady && !qrDataUrl && (
        <p className="text-sm text-muted-foreground">
          Menyiapkan QR code, mohon tunggu...
        </p>
      )}

      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Buka WhatsApp di ponsel, masuk ke Perangkat Tertaut, lalu pindai kode di
        atas.
      </p>
    </div>
  );
};
