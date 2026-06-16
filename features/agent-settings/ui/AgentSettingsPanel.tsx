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
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground">
            Agen Chat-Action (Telegram)
          </h3>
          <p className="text-xs text-muted-foreground">
            Aktifkan agar bisa membuat & menjalankan otomasi lewat chat bot
            Telegram bertenaga Gemini.
          </p>
        </div>

        <span
          className={
            enabled
              ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600"
              : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          }
        >
          {enabled ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat status...</p>
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
              className="text-sm font-medium text-foreground"
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
              className="text-sm font-medium text-foreground"
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
              className="text-sm font-medium text-foreground"
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
            <p className="text-xs text-muted-foreground">
              Flash-Lite cocok saat Flash sedang sibuk (high-traffic).
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
