"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: ROUTES.login })}
    >
      Keluar
    </Button>
  );
}
