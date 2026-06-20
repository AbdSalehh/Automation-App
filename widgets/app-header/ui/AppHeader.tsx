import Link from "next/link";
import { SearchIcon, BellIcon, SettingsIcon } from "lucide-react";
import { ROUTES } from "@/shared/config/constants";
import { BrandLogo } from "@/shared/ui";
import { getCurrentUser } from "@/shared/auth";
import { UserDropdown } from "@/features/user-auth/ui/UserDropdown";
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
              <div className="bg-background text-muted-foreground border-border hidden w-64 items-center gap-2 rounded-md border px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] md:flex lg:w-80">
                <SearchIcon className="size-4" />
                <span className="truncate text-sm">
                  Search workflows, executions...
                </span>
                <kbd className="bg-muted text-muted-foreground border-border ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-sm">
                  ⌘K
                </kbd>
              </div>
            </HideOnEditor>

            <div className="border-border mr-2 flex items-center gap-1.5 border-r pr-4">
              <HideOnEditor>
                <button className="text-muted-foreground hover:bg-accent hover:text-foreground relative grid size-8 place-items-center rounded-full outline-hidden transition-colors">
                  <BellIcon className="size-5" />
                  <span className="ring-background absolute top-1 right-1.5 grid size-3 place-items-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2">
                    5
                  </span>
                </button>
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
