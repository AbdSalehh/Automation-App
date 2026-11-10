import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/auth";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { LoginView } from "@/views/login";

/**
 * Halaman login adalah satu-satunya halaman publik, dan alamat beranda
 * diarahkan ke sini. Hanya judul dan deskripsi yang ditentukan di sini;
 * Open Graph (gambar, nama situs, locale) diwarisi dari layout root, karena
 * Next.js mengganti seluruh objek `openGraph` bila halaman mendefinisikannya.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: `Masuk ke ${APP_NAME} untuk merancang dan menjalankan workflow otomatis Anda.`,
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROUTES.workflows);
  return <LoginView />;
}
