"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "@/shared/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors position="top-center" />
    </SessionProvider>
  );
}
