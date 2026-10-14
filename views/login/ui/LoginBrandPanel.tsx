import { APP_NAME } from "@/shared/config/constants";
import { ShaderBackground } from "@/shared/ui/shader-background/ShaderBackground";

/**
 * Panel kiri halaman login: latar gradien animasi dengan tagline produk.
 * Hanya tampil di layar lebar (lg ke atas); di bawah itu kartu login
 * menjadi satu kolom agar form tidak terhimpit.
 */
export function LoginBrandPanel() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between gap-10 overflow-hidden rounded-2xl bg-neutral-950 p-10 text-white lg:flex">
      <ShaderBackground className="pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 flex items-center gap-3">
        <span className="text-xs font-semibold tracking-widest text-black/80 uppercase">
          Automate. Simplify. Scale.
        </span>
        <div className="h-px w-16 bg-white/30" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <h1 className="font-serif text-4xl leading-tight font-normal tracking-tight text-balance text-white xl:text-5xl">
          Workflow automation made simpler & smarter
        </h1>
        <p className="max-w-xs text-xs leading-relaxed font-normal text-white/80">
          {APP_NAME} helps you build, run, and manage automated workflows
          efficiently.
        </p>
      </div>
    </div>
  );
}
