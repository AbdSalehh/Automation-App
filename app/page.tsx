import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";
import { LandingView } from "@/views/landing";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingView />;
  }

  if (!user.onboardingCompleted) {
    redirect(ROUTES.onboarding);
  }

  redirect(ROUTES.workflows);
}
