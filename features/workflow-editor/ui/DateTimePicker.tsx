"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib/utils";

interface DateTimePickerProps {
  /** Nilai ISO lokal, mis. "2026-06-10T09:00:00". */
  value: string;
  placeholder?: string;
  onChange: (isoValue: string) => void;
}

/**
 * Memecah string ISO lokal menjadi bagian tanggal (Date) dan jam ("HH:MM").
 * Mengembalikan nilai default bila string kosong/invalid.
 */
function parseIsoValue(value: string): {
  date: Date | undefined;
  time: string;
} {
  if (!value) {
    return { date: undefined, time: "09:00" };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { date: undefined, time: "09:00" };
  }

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return { date: parsed, time: `${hours}:${minutes}` };
}

/**
 * Menggabungkan tanggal terpilih dan jam "HH:MM" menjadi string ISO lokal
 * tanpa offset zona waktu, mis. "2026-06-10T09:00:00".
 */
function buildIsoValue(date: Date, time: string): string {
  const [hourPart, minutePart] = time.split(":");

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = (hourPart ?? "00").padStart(2, "0");
  const minute = (minutePart ?? "00").padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

/**
 * Format ringkas untuk ditampilkan di trigger, mis. "10 Jun 2026, 09:00".
 */
function formatSummary(date: Date, time: string): string {
  const dateLabel = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${dateLabel}, ${time}`;
}

export function DateTimePicker({
  value,
  placeholder,
  onChange,
}: DateTimePickerProps) {
  const { date, time } = parseIsoValue(value);
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return;
    }

    onChange(buildIsoValue(nextDate, time));
  };

  const handleTimeChange = (nextTime: string) => {
    const baseDate = date ?? new Date();

    onChange(buildIsoValue(baseDate, nextTime));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {date
            ? formatSummary(date, time)
            : (placeholder ?? "Select date & time")}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          captionLayout="dropdown"
        />

        <div className="border-border flex items-center gap-2 border-t p-3">
          <label className="text-muted-foreground text-xs font-medium">
            Time
          </label>

          <Input
            type="time"
            value={time}
            onChange={(changeEvent) =>
              handleTimeChange(changeEvent.target.value)
            }
            className="w-32"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
