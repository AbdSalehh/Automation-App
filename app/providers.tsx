"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster, TooltipProvider } from "@/shared/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        {children}
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </SessionProvider>
  );
}
