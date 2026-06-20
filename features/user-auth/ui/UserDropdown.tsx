"use client";

import {
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const initials = user.name
    ? user.name.slice(0, 2).toUpperCase()
    : (user.email?.slice(0, 2).toUpperCase() ?? "U");

  const isAdmin = user.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:bg-accent flex items-center gap-2 rounded-md p-1 outline-hidden transition-colors"
        >
          <Avatar className="size-8">
            <AvatarImage src={user.image ?? undefined} alt="User avatar" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start px-1 sm:flex">
            <span className="text-foreground text-sm leading-none font-semibold">
              {user.name ?? "Pengguna"}
            </span>
            <Badge
              variant={isAdmin ? "warning" : "neutral"}
              className="mt-1 gap-1 px-1.5 py-0 text-[10px] uppercase"
            >
              <ShieldCheckIcon className="size-2.5" />
              {isAdmin ? "Admin" : "User"}
            </Badge>
          </div>
          <ChevronDownIcon className="text-muted-foreground ml-1 hidden size-4 sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-medium">{user.name ?? "Pengguna"}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href={ROUTES.settings}>
          <DropdownMenuItem className="cursor-pointer">
            <SettingsIcon className="mr-2 size-4" />
            <span>Pengaturan Akun</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => signOut({ callbackUrl: ROUTES.login })}
        >
          <LogOutIcon className="mr-2 size-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
