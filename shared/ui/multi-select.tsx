"use client";

import { useState } from "react";
import { XIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Badge } from "./Badge";

interface MultiSelectProps {
  /** All selectable options. */
  options: string[];
  /** Currently selected values. */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Allow free-typed values not present in options. */
  allowCustom?: boolean;
  className?: string;
}

/**
 * Tag-style multiple select. Shows selected values as removable chips and a
 * dropdown of remaining options. Optionally allows free-typed custom values.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  allowCustom = false,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const toggleValue = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const removeValue = (option: string) =>
    onChange(value.filter((item) => item !== option));

  const addCustom = () => {
    const trimmed = customInput.trim();

    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }

    setCustomInput("");
  };

  const remainingOptions = options.filter((option) => !value.includes(option));

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="border-input flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1.5 text-left text-sm shadow-xs"
      >
        {value.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}

        {value.map((item) => (
          <Badge key={item} variant="neutral" className="gap-1">
            {item}

            <span
              role="button"
              tabIndex={0}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                removeValue(item);
              }}
              className="hover:text-destructive"
            >
              <XIcon className="size-3" />
            </span>
          </Badge>
        ))}

        <ChevronDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="border-border bg-popover absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border p-1 shadow-md">
          {remainingOptions.length === 0 && !allowCustom && (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">
              Tidak ada pilihan lain
            </p>
          )}

          {remainingOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggleValue(option)}
              className="hover:bg-accent hover:text-accent-foreground block w-full rounded-sm px-2 py-1.5 text-left text-sm"
            >
              {option}
            </button>
          ))}

          {allowCustom && (
            <div className="border-border flex items-center gap-1 border-t p-1">
              <input
                value={customInput}
                onChange={(changeEvent) =>
                  setCustomInput(changeEvent.target.value)
                }
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === "Enter") {
                    keyEvent.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="Ketik nilai lalu Enter"
                className="flex-1 rounded-sm bg-transparent px-2 py-1 text-sm outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
