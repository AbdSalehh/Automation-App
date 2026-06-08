import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of a value that only updates after the given delay
 * has elapsed without further changes. Used by the shadcn search input.
 */
export function useDebounce<TValue>(value: TValue, delayMs = 300): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
