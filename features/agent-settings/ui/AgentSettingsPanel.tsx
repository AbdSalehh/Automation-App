"use client";

import { useEffect } from "react";
import { Button, Input, NativeSelect, NativeSelectOption } from "@/shared/ui";
import { GEMINI_MODELS } from "@/shared/config/constants";
import { useAgentSettingsStore } from "../model/agentSettings.store";

/**
 * Panel pengaturan Agen Chat-Action. Saat diaktifkan, pengguna mengisi Bot
 * Token Telegram (BotFather) + Gemini API key dan memilih model. Seluruh state
 * loading/error dikelola di store.
 */
export function AgentSettingsPanel() {
  const {
    enabled,
    geminiModel,
    botToken,
    geminiApiKey,
    isLoading,
    isSaving,
    error,
    successMessage,
    setBotToken,
    setGeminiApiKey,
    setGeminiModel,
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
            Telegram bertenaga Gemini.
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
              Agen aktif menggunakan model{" "}
              <span className="font-medium">{geminiModel}</span>. Isi ulang
              formulir di bawah untuk mengganti bot/key/model.
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
            <label
              htmlFor="agentGeminiKey"
              className="text-foreground text-sm font-medium"
            >
              Gemini API Key
            </label>
            <Input
              id="agentGeminiKey"
              type="password"
              placeholder="AIza..."
              value={geminiApiKey}
              onChange={(event) => setGeminiApiKey(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="agentGeminiModel"
              className="text-foreground text-sm font-medium"
            >
              Model Gemini
            </label>
            <NativeSelect
              id="agentGeminiModel"
              className="w-full"
              value={geminiModel}
              onChange={(event) => setGeminiModel(event.target.value)}
            >
              {GEMINI_MODELS.map((model) => (
                <NativeSelectOption key={model.value} value={model.value}>
                  {model.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-muted-foreground text-xs">
              Flash-Lite cocok saat Flash sedang sibuk (high-traffic).
            </p>
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
