"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, WorkflowIcon, KeyRoundIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Spinner } from "@/shared/ui";
import { ROUTES } from "@/shared/config/constants";
import { cn } from "@/shared/lib/utils";
import { useSearchStore } from "@/entities/search";

/** Jeda debounce sebelum mengirim kueri ke server (ms). */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Pencarian global (command palette) yang dibuka lewat tombol header atau
 * pintasan ⌘K / Ctrl+K. Mencari workflow & kredensial milik pengguna, lalu
 * menavigasi ke item yang dipilih.
 */
export function GlobalSearch() {
  const router = useRouter();

  const { term, results, isSearching, setTerm, runSearch, resetSearch } =
    useSearchStore();

  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Buka palette dengan ⌘K / Ctrl+K dari mana saja. */
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (
        (keyboardEvent.metaKey || keyboardEvent.ctrlKey) &&
        keyboardEvent.key.toLowerCase() === "k"
      ) {
        keyboardEvent.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /** Bersihkan kueri saat palette ditutup. */
  useEffect(() => {
    if (!isOpen) {
      resetSearch();
    }
  }, [isOpen, resetSearch]);

  const handleTermChange = (nextTerm: string) => {
    setTerm(nextTerm);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runSearch(nextTerm);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const hasResults =
    results.workflows.length > 0 || results.credentials.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-background text-muted-foreground border-border hover:bg-accent hidden w-64 items-center gap-2 rounded-md border px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors md:flex lg:w-80"
      >
        <SearchIcon className="size-4" />
        <span className="truncate text-sm">
          Search workflows, credentials...
        </span>
        <kbd className="bg-muted text-muted-foreground border-border ml-auto rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold shadow-sm">
          ⌘K
        </kbd>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        >
          <DialogTitle className="sr-only">Global search</DialogTitle>

          <div className="border-border flex items-center gap-2 border-b px-4">
            <SearchIcon className="text-muted-foreground size-4 shrink-0" />

            <input
              autoFocus
              value={term}
              onChange={(changeEvent) =>
                handleTermChange(changeEvent.target.value)
              }
              placeholder="Search workflows or credentials..."
              className="text-foreground placeholder:text-muted-foreground w-full bg-transparent py-3.5 text-sm outline-none"
            />

            {isSearching && <Spinner />}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {!term.trim() ? (
              <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                Type to start searching.
              </p>
            ) : !hasResults && !isSearching ? (
              <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                No results for &quot;{term}&quot;.
              </p>
            ) : (
              <>
                {results.workflows.length > 0 && (
                  <ResultGroup label="Workflow">
                    {results.workflows.map((workflow) => (
                      <ResultRow
                        key={workflow.id}
                        icon={<WorkflowIcon className="size-4" />}
                        label={workflow.name}
                        onSelect={() =>
                          handleNavigate(ROUTES.workflow(workflow.id))
                        }
                      />
                    ))}
                  </ResultGroup>
                )}

                {results.credentials.length > 0 && (
                  <ResultGroup label="Credentials">
                    {results.credentials.map((credential) => (
                      <ResultRow
                        key={credential.id}
                        icon={<KeyRoundIcon className="size-4" />}
                        label={credential.name}
                        hint={credential.type}
                        onSelect={() => handleNavigate(ROUTES.credentials)}
                      />
                    ))}
                  </ResultGroup>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ResultGroupProps {
  label: string;
  children: React.ReactNode;
}

function ResultGroup({ label, children }: ResultGroupProps) {
  return (
    <div className="mb-1">
      <p className="text-muted-foreground px-2 py-1 text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>

      <div className="flex flex-col">{children}</div>
    </div>
  );
}

interface ResultRowProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onSelect: () => void;
}

function ResultRow({ icon, label, hint, onSelect }: ResultRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
      )}
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>

      <span className="text-foreground truncate">{label}</span>

      {hint && (
        <span className="text-muted-foreground ml-auto shrink-0 text-xs">
          {hint}
        </span>
      )}
    </button>
  );
}
