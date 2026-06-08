import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";
import { OnboardingView } from "@/views/onboarding";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  // Already onboarded — skip back to the app
  if (user.onboardingCompleted) {
    redirect(ROUTES.workflows);
  }

  return <OnboardingView userName={user.name ?? null} />;
}
