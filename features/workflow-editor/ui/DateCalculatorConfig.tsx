"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";

interface DateOffsets {
  minutes?: number;
  hours?: number;
  days?: number;
  months?: number;
  years?: number;
}

interface DateCalculatorConfigProps {
  config: Record<string, unknown>;
  availableColumns: string[];
  onConfigChange: (key: string, value: unknown) => void;
}

const OFFSET_UNITS: { key: keyof DateOffsets; label: string }[] = [
  { key: "minutes", label: "Minutes" },
  { key: "hours", label: "Hours" },
  { key: "days", label: "Days" },
  { key: "months", label: "Months" },
  { key: "years", label: "Years" },
];

export function DateCalculatorConfig({
  config,
  availableColumns,
  onConfigChange,
}: DateCalculatorConfigProps) {
  const mode = String(config.mode ?? "relative");
  const operation = String(config.operation ?? "subtract");
  const dateField = String(config.dateField ?? "");
  const time = String(config.time ?? "");
  const absoluteDate = String(config.absoluteDate ?? "");

  const offsets = (config.offsets as DateOffsets) ?? {};

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isAbsolute = mode === "absolute";

  const updateOffset = (unitKey: keyof DateOffsets, rawValue: string) => {
    const numericValue = Number(rawValue);

    onConfigChange("offsets", {
      ...offsets,
      [unitKey]: Number.isNaN(numericValue) ? 0 : numericValue,
    });
  };

  const selectedDate = absoluteDate ? new Date(absoluteDate) : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Mode switch */}
      <div className="border-border bg-muted/20 flex items-center justify-between rounded-md border px-3 py-2">
        <div className="flex flex-col">
          <Label className="text-foreground text-xs font-medium">
            Absolute Date
          </Label>
          <span className="text-muted-foreground text-[11px]">
            Use a fixed date from the calendar
          </span>
        </div>

        <Switch
          checked={isAbsolute}
          onCheckedChange={(checked) =>
            onConfigChange("mode", checked ? "absolute" : "relative")
          }
        />
      </div>

      {isAbsolute ? (
        <div>
          <Label className="text-muted-foreground mb-1 block text-xs font-medium">
            Select Date
          </Label>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !absoluteDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-4" />
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Select date"}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  onConfigChange(
                    "absoluteDate",
                    date ? date.toISOString() : "",
                  );
                  setIsCalendarOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <>
          {/* Base column */}
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs font-medium">
              Base Date Column
            </Label>

            <Select
              value={dateField || "_none"}
              onValueChange={(value) =>
                onConfigChange("dateField", value === "_none" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— select column (default: now) —" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="_none">Now</SelectItem>

                {availableColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operation */}
          <div>
            <Label className="text-muted-foreground mb-1 block text-xs font-medium">
              Operation
            </Label>

            <Select
              value={operation}
              onValueChange={(value) => onConfigChange("operation", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="subtract">Subtract (before)</SelectItem>
                <SelectItem value="add">Add (after)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Offset units */}
          <div>
            <Label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              Time Offset
            </Label>

            <div className="grid grid-cols-2 gap-2">
              {OFFSET_UNITS.map((unit) => (
                <div key={unit.key} className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-[11px]">
                    {unit.label}
                  </span>

                  <Input
                    type="number"
                    min={0}
                    value={String(offsets[unit.key] ?? "")}
                    placeholder="0"
                    onChange={(changeEvent) =>
                      updateOffset(unit.key, changeEvent.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Shared time-of-day override */}
      <div>
        <Label className="text-muted-foreground mb-1 block text-xs font-medium">
          Execution Time (optional)
        </Label>

        <Input
          type="time"
          value={time}
          onChange={(changeEvent) =>
            onConfigChange("time", changeEvent.target.value)
          }
        />

        <p className="text-muted-foreground mt-1 text-xs">
          Set a specific time on the resulting date. Leave blank to keep the
          original time.
        </p>
      </div>
    </div>
  );
}
