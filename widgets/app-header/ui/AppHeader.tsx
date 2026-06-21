import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { ROUTES } from "@/shared/config/constants";
import { BrandLogo } from "@/shared/ui";
import { getCurrentUser } from "@/shared/auth";
import { UserDropdown } from "@/features/user-auth/ui/UserDropdown";
import { NotificationBell } from "@/features/notifications";
import { GlobalSearch } from "@/features/global-search";
import { WorkflowEditorHeaderBar } from "./WorkflowEditorHeaderBar";
import { HideOnEditor } from "./HideOnEditor";

const NAV_ITEMS = [
  { href: ROUTES.dashboard, label: "Dashboard" },
  { href: ROUTES.workflows, label: "Workflows" },
  { href: ROUTES.credentials, label: "Credentials" },
];

export async function AppHeader() {
  const user = await getCurrentUser();

  const navItems =
    user?.role === "admin"
      ? [...NAV_ITEMS, { href: ROUTES.users, label: "Users" }]
      : NAV_ITEMS;

  return (
    <header className="border-border bg-card sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link
          href={ROUTES.dashboard}
          className="text-foreground flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          <BrandLogo size={28} textClassName="text-xl" />
        </Link>

        {user && (
          <>
            <WorkflowEditorHeaderBar />

            <HideOnEditor>
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((navItem) => (
                  <Link
                    key={navItem.href}
                    href={navItem.href}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium"
                  >
                    {navItem.label}
                  </Link>
                ))}
              </nav>
            </HideOnEditor>
          </>
        )}

        {user && (
          <div className="ml-auto flex shrink-0 items-center gap-4">
            <HideOnEditor>
              <GlobalSearch />
            </HideOnEditor>

            <div className="border-border mr-2 flex items-center gap-1.5 border-r pr-4">
              <HideOnEditor>
                <NotificationBell />
              </HideOnEditor>

              <Link
                href={ROUTES.settings}
                className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-full outline-hidden transition-colors"
              >
                <SettingsIcon className="size-5" />
              </Link>
            </div>

            <UserDropdown user={user} />
          </div>
        )}
      </div>
    </header>
  );
}
