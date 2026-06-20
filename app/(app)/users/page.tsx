import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config/constants";
import { UsersView } from "@/views/users";

/**
 * Halaman /users khusus admin. Pengguna non-admin diarahkan kembali ke
 * dashboard.
 */
export default async function UsersPage() {
  const user = await getCurrentUser();

  if (user?.role !== "admin") {
    redirect(ROUTES.dashboard);
  }

  return <UsersView />;
}
