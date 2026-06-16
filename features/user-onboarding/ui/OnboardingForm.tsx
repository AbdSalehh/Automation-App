"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/config/constants";
import { WhatsappQrLogin } from "@/features/whatsapp-qr-login";
import { useWhatsappSessionStore } from "@/entities/whatsapp-session";
import {
  useOnboardingStore,
  type UsagePurpose,
} from "../store/onboarding.store";

const PURPOSE_OPTIONS: {
  value: UsagePurpose;
  label: string;
  description: string;
}[] = [
  {
    value: "learning",
    label: "Belajar",
    description: "Saya ingin mempelajari workflow automation",
  },
  {
    value: "personal",
    label: "Personal",
    description: "Untuk kebutuhan pribadi sehari-hari",
  },
  {
    value: "professional",
    label: "Profesional",
    description: "Untuk mendukung pekerjaan saya",
  },
  {
    value: "team",
    label: "Tim / Bisnis",
    description: "Digunakan bersama tim atau untuk kebutuhan bisnis",
  },
];

type OnboardingStep = "whatsapp" | "gemini" | "purpose";

export function OnboardingForm() {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>("whatsapp");

  const {
    formData,
    isLoading,
    isSavingGeminiKey,
    error,
    setUsagePurpose,
    setOrganisation,
    setGeminiApiKey,
    saveGeminiKey,
    submitOnboarding,
  } = useOnboardingStore();

  const { isReady } = useWhatsappSessionStore();

  const handleGeminiNext = async () => {
    const success = await saveGeminiKey();

    if (success) {
      setStep("purpose");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const success = await submitOnboarding();

    if (success) {
      router.push(ROUTES.workflows);
      router.refresh();
    }
  };

  if (step === "whatsapp") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Langkah 1 dari 3 — Hubungkan WhatsApp Agen
          </p>
          <p className="text-xs text-muted-foreground">
            Pindai kode QR untuk menautkan akun WhatsApp yang akan menjadi agen
            chat-action Anda.
          </p>
        </div>

        <WhatsappQrLogin />

        <Button
          type="button"
          onClick={() => setStep("gemini")}
          disabled={!isReady}
          className="w-full"
        >
          {isReady ? "Lanjut" : "Menunggu koneksi WhatsApp..."}
        </Button>
      </div>
    );
  }

  if (step === "gemini") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Langkah 2 dari 3 — Gemini API Key
          </p>
          <p className="text-xs text-muted-foreground">
            Agen memakai Google Gemini untuk memahami dan membalas pesan.
            Dapatkan key gratis di aistudio.google.com.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="geminiApiKey"
            className="text-sm font-medium text-foreground"
          >
            Gemini API Key
          </label>
          <Input
            id="geminiApiKey"
            type="password"
            placeholder="AIza..."
            value={formData.geminiApiKey}
            onChange={(event) => setGeminiApiKey(event.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep("whatsapp")}
            className="flex-1"
          >
            Kembali
          </Button>
          <Button
            type="button"
            onClick={handleGeminiNext}
            disabled={isSavingGeminiKey || !formData.geminiApiKey.trim()}
            className="flex-1"
          >
            {isSavingGeminiKey ? "Menyimpan..." : "Lanjut"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Langkah 3 dari 3 — Tujuan Penggunaan
        </p>
        <p className="text-xs text-muted-foreground">
          Apa tujuan utama kamu menggunakan AutoFlow?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PURPOSE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setUsagePurpose(option.value)}
            className={cn(
              "flex flex-col items-start rounded-lg border p-4 text-left transition-all",
              "hover:border-primary hover:bg-primary/5",
              formData.usagePurpose === option.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card",
            )}
          >
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="organisation"
          className="text-sm font-medium text-foreground"
        >
          Nama organisasi / perusahaan{" "}
          <span className="text-muted-foreground font-normal">(opsional)</span>
        </label>
        <Input
          id="organisation"
          type="text"
          placeholder="Contoh: PT Maju Bersama"
          value={formData.organisation}
          onChange={(event) => setOrganisation(event.target.value)}
          maxLength={120}
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !formData.usagePurpose}
        className="w-full"
      >
        {isLoading ? "Menyimpan..." : "Mulai Gunakan AutoFlow"}
      </Button>
    </form>
  );
}
