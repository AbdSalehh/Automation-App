"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Mengaktifkan smooth scroll Lenis selama komponen ini terpasang. Dipakai
 * membungkus landing page agar guliran terasa halus. Membersihkan instance saat
 * unmount sehingga halaman aplikasi lain tetap memakai scroll native.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
    });

    let animationFrameId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    };

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
