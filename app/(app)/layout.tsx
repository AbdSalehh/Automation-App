import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";
import { AppHeader } from "@/widgets/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (!user.onboardingCompleted) {
    redirect(ROUTES.onboarding);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
