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
            Chat-Action Agent (Telegram)
          </h3>
          <p className="text-muted-foreground text-xs">
            Enable this to create & run automations through a Telegram chat bot
            with support for multiple AI credentials.
          </p>
        </div>

        <span
          className={
            enabled
              ? "rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600"
              : "bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium"
          }
        >
          {enabled ? "Active" : "Inactive"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading status...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {enabled && (
            <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
              The agent is active. Re-fill the form below to change the bot or
              AI credentials (the Bot Token is hidden for security).
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="agentBotToken"
              className="text-foreground text-sm font-medium"
            >
              Telegram Bot Token
            </label>
            <Input
              id="agentBotToken"
              type="password"
              placeholder="From @BotFather → /newbot"
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-foreground text-sm font-medium">
              AI Credentials & Fallback
            </label>

            <p className="text-muted-foreground text-xs">
              The topmost credential is used first. If it fails to respond, the
              system automatically tries the next credential.
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
                ? "Saving..."
                : enabled
                  ? "Update Agent"
                  : "Enable Agent"}
            </Button>

            {enabled && (
              <Button
                type="button"
                variant="secondary"
                onClick={reregisterWebhook}
                disabled={isReregistering}
              >
                {isReregistering ? "Registering..." : "Re-register Webhook"}
              </Button>
            )}

            {enabled && (
              <Button
                type="button"
                variant="secondary"
                onClick={disableAgent}
                disabled={isSaving}
              >
                Disable
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
