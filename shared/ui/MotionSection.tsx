"use client";

import { motion } from "motion/react";
import { fadeInUp } from "@/shared/lib/motion-presets";
import { cn } from "@/shared/lib/utils";

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Render sebagai elemen lain (mis. "section"). Default div. */
  as?: "div" | "section";
}

/**
 * Pembungkus animasi fade-up yang dipicu saat masuk viewport. Dipakai untuk
 * menganimasikan section/kartu di landing maupun halaman aplikasi.
 */
export function MotionSection({
  children,
  className,
  as = "div",
}: MotionSectionProps) {
  const MotionTag = as === "section" ? motion.section : motion.div;

  return (
    <MotionTag
      className={cn(className)}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </MotionTag>
  );
}
