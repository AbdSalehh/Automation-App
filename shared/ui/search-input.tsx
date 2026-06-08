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
    <div className={`relative flex-1 max-w-xs ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 pointer-events-none" />
      <input
        type="search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-xl text-sm border dark:border-neutral-700 border-neutral-200 dark:bg-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
      />
      {inputValue && (
        <button
          onClick={() => {
            setInputValue("");
            pushSearch("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
          aria-label="Hapus pencarian"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

export default function SearchInput(props: SearchInputProps) {
  return (
    <Suspense
      fallback={
        <div className={`relative flex-1 max-w-xs ${props.className || ""}`}>
          <div className="w-full pl-9 pr-8 py-2 h-[38px] rounded-xl border dark:border-neutral-700 border-neutral-200 dark:bg-neutral-800 bg-white opacity-50 animate-pulse" />
        </div>
      }
    >
      <SearchInputInner {...props} />
    </Suspense>
  );
}
