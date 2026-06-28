"use client";

import { useRouter } from "next/navigation";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";
import { ROUTES } from "@/shared/config/constants";
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
    label: "Learning",
    description: "I want to learn workflow automation",
  },
  {
    value: "personal",
    label: "Personal",
    description: "For everyday personal needs",
  },
  {
    value: "professional",
    label: "Professional",
    description: "To support my work",
  },
  {
    value: "team",
    label: "Team / Business",
    description: "Used with a team or for business needs",
  },
];

export function OnboardingForm() {
  const router = useRouter();

  const {
    formData,
    isLoading,
    error,
    setUsagePurpose,
    setOrganisation,
    submitOnboarding,
  } = useOnboardingStore();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const success = await submitOnboarding();

    if (success) {
      router.push(ROUTES.workflows);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Usage Purpose</p>
        <p className="text-muted-foreground text-xs">
          What is your main goal for using Fluxera?
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
                ? "border-primary bg-primary/5 ring-primary ring-1"
                : "border-border bg-card",
            )}
          >
            <span className="text-foreground text-sm font-medium">
              {option.label}
            </span>
            <span className="text-muted-foreground mt-0.5 text-xs">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="organisation"
          className="text-foreground text-sm font-medium"
        >
          Organisation / company name{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="organisation"
          type="text"
          placeholder="Example: Acme Corp"
          value={formData.organisation}
          onChange={(event) => setOrganisation(event.target.value)}
          maxLength={120}
        />
      </div>

      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !formData.usagePurpose}
        className="w-full"
      >
        {isLoading ? "Saving..." : "Start Using Fluxera"}
      </Button>
    </form>
  );
}
