import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (!user.onboardingCompleted) {
    redirect(ROUTES.onboarding);
  }

  redirect(ROUTES.workflows);
}
