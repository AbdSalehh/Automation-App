import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";
import { LoginView } from "@/views/login";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROUTES.workflows);
  return <LoginView />;
}
