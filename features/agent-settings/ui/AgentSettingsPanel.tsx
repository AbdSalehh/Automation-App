"use client";

import { useEffect } from "react";
import { Button, Input } from "@/shared/ui";
import { useAgentSettingsStore } from "../model/agentSettings.store";
import { AiCredentialPicker } from "./AiCredentialPicker";

/**
 * Panel pengaturan Agen Chat-Action (Telegram). Pengguna mengisi Bot Token
 * (BotFather) lalu memilih satu atau beberapa kredensial AI. Kredensial teratas
 * dipakai lebih dulu; bila gagal, sistem otomatis turun ke kredensial berikutnya
 * (fallback). Hanya satu agen yang bisa aktif per pengguna. Seluruh state
 * loading/error dikelola di store.
 */
export function AgentSettingsPanel() {
  const {
    enabled,
    botToken,
    credentialIds,
    isLoading,
    isSaving,
    isReregistering,
    error,
    successMessage,
    setBotToken,
    setCredentialIds,
    fetchStatus,
    saveConfig,
    reregisterWebhook,
    disableAgent,
  } = useAgentSettingsStore();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-foreground text-sm font-semibold">
            Agen Chat-Action (Telegram)
          </h3>
          <p className="text-muted-foreground text-xs">
            Aktifkan agar bisa membuat & menjalankan otomasi lewat chat bot
            Telegram dengan dukungan beberapa kredensial AI.
          </p>
        </div>

        <span
          className={
            enabled
              ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600"
              : "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
          }
        >
          {enabled ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Memuat status...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {enabled && (
            <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
              Agen aktif. Isi ulang formulir di bawah untuk mengganti bot atau
              kredensial AI (Bot Token tidak ditampilkan demi keamanan).
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="agentBotToken"
              className="text-foreground text-sm font-medium"
            >
              Bot Token Telegram
            </label>
            <Input
              id="agentBotToken"
              type="password"
              placeholder="Dari @BotFather → /newbot"
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-medium">
              Kredensial AI & Fallback
            </label>

            <p className="text-muted-foreground text-xs">
              Kredensial paling atas dipakai lebih dulu. Bila gagal merespons,
              sistem otomatis mencoba kredensial berikutnya.
            </p>

            <AiCredentialPicker
              selectedIds={credentialIds}
              onChange={setCredentialIds}
            />
          </div>

          {error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={saveConfig}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving
                ? "Menyimpan..."
                : enabled
                  ? "Perbarui Agen"
                  : "Aktifkan Agen"}
            </Button>

            {enabled && (
              <Button
                type="button"
                variant="secondary"
                onClick={reregisterWebhook}
                disabled={isReregistering}
              >
                {isReregistering
                  ? "Mendaftarkan..."
                  : "Daftarkan Ulang Webhook"}
              </Button>
            )}

            {enabled && (
              <Button
                type="button"
                variant="secondary"
                onClick={disableAgent}
                disabled={isSaving}
              >
                Nonaktifkan
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
