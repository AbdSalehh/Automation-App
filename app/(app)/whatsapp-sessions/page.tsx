import { redirect } from "next/navigation";

import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";
import { WhatsappSessionsView } from "@/views/whatsapp-sessions";

/**
 * Halaman pemantauan WhatsApp khusus admin.
 */
export default async function WhatsappSessionsPage() {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect(ROUTES.dashboard);
  }

  return <WhatsappSessionsView />;
}
