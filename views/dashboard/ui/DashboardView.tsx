import { requireUser } from "@/shared/auth";
import { DashboardClient } from "./DashboardClient";

/**
 * Halaman dashboard (gambar 1). Komponen server tipis yang hanya mengambil
 * nama pengguna untuk sapaan, lalu menyerahkan render interaktif ke klien.
 */
export async function DashboardView() {
  const sessionUser = await requireUser();

  const firstName = (sessionUser.name ?? "there").split(" ")[0];

  return <DashboardClient name={firstName} />;
}
