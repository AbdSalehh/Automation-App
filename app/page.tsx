import { getCurrentUser } from "@/shared/auth";
import { LandingView } from "@/views/landing";

/**
 * Halaman beranda publik. Selalu menampilkan landing page, termasuk untuk
 * pengguna yang sudah login, sehingga "/" tetap dapat diakses kapan pun.
 * Status login diteruskan agar header bisa menampilkan tombol yang sesuai.
 */
export default async function Home() {
  const user = await getCurrentUser();

  return <LandingView isAuthenticated={Boolean(user)} />;
}
