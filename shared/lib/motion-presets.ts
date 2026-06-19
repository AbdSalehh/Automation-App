import type { Variants } from "motion/react";

/**
 * Preset animasi reusable berbasis motion. Dipakai lintas halaman (landing,
 * dashboard, workflows, dll.) agar transisi konsisten dan tidak ditulis ulang.
 */

/** Muncul dari bawah sambil fade-in. Cocok untuk kartu/section. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Fade-in sederhana tanpa pergeseran. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

/** Container yang menata kemunculan anak-anaknya secara berurutan. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Item anak untuk dipakai bersama `staggerContainer`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};
