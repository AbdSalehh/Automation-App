import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { APP_NAME, ROUTES } from "@/shared/config/constants";
import { getCurrentUser } from "@/shared/auth";
import { LogoutButton } from "@/features/user-auth";
import { WorkflowEditorHeaderBar } from "./WorkflowEditorHeaderBar";

const NAV_ITEMS = [
  { href: ROUTES.workflows, label: "Workflows" },
  { href: ROUTES.credentials, label: "Credentials" },
  { href: ROUTES.executions, label: "Executions" },
];

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link
          href={ROUTES.workflows}
          className="flex shrink-0 items-center gap-2 text-lg font-bold text-primary"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ZapIcon className="size-4" />
          </span>
          {APP_NAME}
        </Link>

        {user && (
          <>
            <WorkflowEditorHeaderBar />

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((navItem) => (
                <Link
                  key={navItem.href}
                  href={navItem.href}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {navItem.label}
                </Link>
              ))}
            </nav>
          </>
        )}

        {user && (
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name ?? user.email}
            </span>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
