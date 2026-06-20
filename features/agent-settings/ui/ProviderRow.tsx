"use client";

import { ArrowUpIcon, ArrowDownIcon, Trash2Icon } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  AI_PROVIDERS,
  AI_PROVIDER_MODELS,
  AI_PROVIDER_DEFAULT_MODEL,
  type AiProviderId,
} from "@/shared/config/constants";
import type { ProviderDraft } from "../model/agentSettings.store";

interface ProviderRowProps {
  provider: ProviderDraft;
  index: number;
  total: number;
  onUpdate: (patch: Partial<ProviderDraft>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}

/**
 * Satu baris penyedia AI di form pengaturan agen. Baris teratas berperan sebagai
 * penyedia utama; baris di bawahnya menjadi fallback berurutan.
 */
export function ProviderRow({
  provider,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: ProviderRowProps) {
  const models = AI_PROVIDER_MODELS[provider.provider];

  const handleProviderChange = (value: string) => {
    const nextProvider = value as AiProviderId;

    onUpdate({
      provider: nextProvider,
      model: AI_PROVIDER_DEFAULT_MODEL[nextProvider],
    });
  };

  return (
    <div className="border-border bg-background flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-foreground text-xs font-semibold">
          {index === 0 ? "Penyedia Utama" : `Fallback ${index}`}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove("up")}
            disabled={index === 0}
            aria-label="Naikkan prioritas"
          >
            <ArrowUpIcon className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            aria-label="Turunkan prioritas"
          >
            <ArrowDownIcon className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Hapus penyedia"
          >
            <Trash2Icon className="text-destructive size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-medium">
            Penyedia
          </label>
          <Select
            value={provider.provider}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih penyedia" />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-medium">
            Model
          </label>
          <Select
            value={provider.model}
            onValueChange={(value) => onUpdate({ model: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-muted-foreground text-xs font-medium">
          API Key
        </label>
        <Input
          type="password"
          placeholder="Masukkan API key penyedia"
          value={provider.apiKey}
          onChange={(event) => onUpdate({ apiKey: event.target.value })}
        />
      </div>
    </div>
  );
}
