"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  Suspense,
} from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/shared/hooks/use-debounce";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

/**
 * Server-friendly search input: updates the ?search= URL param and navigates
 * to page 1, preserving other params (limit, etc.).
 */
function SearchInputInner({
  placeholder = "Cari...",
  className = "",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";

  // Local state for immediate input feedback
  const [inputValue, setInputValue] = useState(currentSearch);

  // Debounce the input value by 500ms
  const debouncedSearch = useDebounce(inputValue, 500);

  const pushSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1"); // reset to page 1 on new search
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  // Trigger search when debounced value changes, and it's different from URL
  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      pushSearch(debouncedSearch);
    }
  }, [debouncedSearch, currentSearch, pushSearch]);

  return (
    <div className={`relative max-w-xs flex-1 ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-40" />
      <input
        type="search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="focus:ring-primary-500/30 w-full rounded-xl border border-neutral-200 bg-white py-2 pr-8 pl-9 text-sm transition-all focus:ring-2 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue("");
            pushSearch("");
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 opacity-40 transition-opacity hover:opacity-70"
          aria-label="Hapus pencarian"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {isPending && (
        <div className="border-primary-500 absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-t-transparent" />
      )}
    </div>
  );
}

export default function SearchInput(props: SearchInputProps) {
  return (
    <Suspense
      fallback={
        <div className={`relative max-w-xs flex-1 ${props.className || ""}`}>
          <div className="h-[38px] w-full animate-pulse rounded-xl border border-neutral-200 bg-white py-2 pr-8 pl-9 opacity-50 dark:border-neutral-700 dark:bg-neutral-800" />
        </div>
      }
    >
      <SearchInputInner {...props} />
    </Suspense>
  );
}
