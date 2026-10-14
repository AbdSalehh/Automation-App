import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { ARE_PUBLIC_PAGES_ENABLED, ROUTES } from "@/shared/config/constants";
import { LandingView } from "@/views/landing";

/**
 * Beranda publik. Selama halaman publik dinonaktifkan, pengunjung diarahkan
 * ke login dan pengguna yang sudah masuk langsung ke aplikasi. Landing page
 * tetap tersimpan dan tampil kembali bila saklarnya dinyalakan.
 */
export default async function Home() {
  const user = await getCurrentUser();

  if (!ARE_PUBLIC_PAGES_ENABLED) {
    redirect(user ? ROUTES.workflows : ROUTES.login);
  }

  return <LandingView isAuthenticated={Boolean(user)} />;
}
