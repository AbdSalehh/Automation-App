"use client";

import { useEffect } from "react";
import { PlusIcon } from "lucide-react";
import { Button, Input } from "@/shared/ui";
import { useAgentSettingsStore } from "../model/agentSettings.store";
import { ProviderRow } from "./ProviderRow";

/**
 * Panel pengaturan Agen Chat-Action (Telegram). Pengguna mengisi Bot Token
 * (BotFather) dan satu atau beberapa penyedia AI. Penyedia teratas dipakai
 * lebih dulu; bila gagal, sistem otomatis turun ke penyedia berikutnya
 * (fallback). Seluruh state loading/error dikelola di store.
 */
export function AgentSettingsPanel() {
  const {
    enabled,
    botToken,
    providers,
    isLoading,
    isSaving,
    error,
    successMessage,
    setBotToken,
    addProvider,
    removeProvider,
    updateProvider,
    moveProvider,
    fetchStatus,
    saveConfig,
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
            Telegram dengan dukungan beberapa penyedia AI.
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
              penyedia AI (API key tidak ditampilkan demi keamanan).
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-sm font-medium">
                Penyedia AI & Fallback
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProvider}
              >
                <PlusIcon className="size-4" />
                Tambah Penyedia
              </Button>
            </div>

            <p className="text-muted-foreground text-xs">
              Penyedia paling atas dipakai lebih dulu. Bila gagal merespons,
              sistem otomatis mencoba penyedia berikutnya.
            </p>

            {providers.map((provider, index) => (
              <ProviderRow
                key={provider.id}
                provider={provider}
                index={index}
                total={providers.length}
                onUpdate={(patch) => updateProvider(provider.id, patch)}
                onRemove={() => removeProvider(provider.id)}
                onMove={(direction) => moveProvider(provider.id, direction)}
              />
            ))}
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
