"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";

interface ScheduleTriggerConfigProps {
  config: Record<string, unknown>;
  onConfigChange: (updates: Record<string, unknown>) => void;
}

const WEEKDAYS: { value: string; label: string }[] = [
  { value: "1", label: "Sen" },
  { value: "2", label: "Sel" },
  { value: "3", label: "Rab" },
  { value: "4", label: "Kam" },
  { value: "5", label: "Jum" },
  { value: "6", label: "Sab" },
  { value: "0", label: "Min" },
];

type ScheduleMode = "interval" | "daily" | "weekly";

/**
 * Builds a 5-field cron string from friendly inputs so non-technical users can
 * set recurring schedules (every N minutes/hours, daily at a time, or on chosen
 * weekdays) without writing cron syntax.
 */
export function ScheduleTriggerConfig({
  config,
  onConfigChange,
}: ScheduleTriggerConfigProps) {
  const scheduleMode = (String(config.scheduleMode ?? "daily") ||
    "daily") as ScheduleMode;

  const intervalUnit = String(config.intervalUnit ?? "minutes");
  const intervalEvery = Number(config.intervalEvery ?? 5);
  const dailyTime = String(config.dailyTime ?? "09:00");
  const weeklyTime = String(config.weeklyTime ?? "09:00");

  const selectedDays = Array.isArray(config.weeklyDays)
    ? (config.weeklyDays as string[])
    : ["1"];

  /** Recomputes and persists the cron string for the active builder mode. */
  const applyCron = (
    mode: ScheduleMode,
    overrides: Record<string, unknown>,
  ) => {
    const merged = {
      intervalUnit,
      intervalEvery,
      dailyTime,
      weeklyTime,
      selectedDays,
      ...overrides,
    };

    let cron = "0 9 * * *";

    if (mode === "interval") {
      const every = Math.max(1, Number(merged.intervalEvery) || 1);

      cron =
        merged.intervalUnit === "hours"
          ? `0 */${every} * * *`
          : `*/${every} * * * *`;
    }

    if (mode === "daily") {
      const [hours, minutes] = String(merged.dailyTime).split(":");
      cron = `${Number(minutes) || 0} ${Number(hours) || 0} * * *`;
    }

    if (mode === "weekly") {
      const [hours, minutes] = String(merged.weeklyTime).split(":");
      const days =
        (merged.selectedDays as string[]).length > 0
          ? (merged.selectedDays as string[]).join(",")
          : "1";

      cron = `${Number(minutes) || 0} ${Number(hours) || 0} * * ${days}`;
    }

    return cron;
  };

  const handleModeChange = (mode: string) => {
    const nextMode = mode as ScheduleMode;
    const cron = applyCron(nextMode, {});
    onConfigChange({ scheduleMode: nextMode, cron });
  };

  const toggleDay = (dayValue: string) => {
    const nextDays = selectedDays.includes(dayValue)
      ? selectedDays.filter((day) => day !== dayValue)
      : [...selectedDays, dayValue];

    const cron = applyCron("weekly", { selectedDays: nextDays });
    onConfigChange({ weeklyDays: nextDays, cron });
  };

  const currentCron = String(config.cron ?? "0 9 * * *");

  return (
    <div className="flex flex-col gap-3">
      <Tabs value={scheduleMode} onValueChange={handleModeChange}>
        <TabsList className="w-full">
          <TabsTrigger value="interval" className="flex-1">
            Interval
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex-1">
            Harian
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">
            Mingguan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interval" className="mt-3 flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs font-medium">
            Jalankan setiap
          </Label>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={String(intervalEvery)}
              className="w-24"
              onChange={(changeEvent) => {
                const nextValue = Number(changeEvent.target.value) || 1;
                const cron = applyCron("interval", {
                  intervalEvery: nextValue,
                });
                onConfigChange({ intervalEvery: nextValue, cron });
              }}
            />

            <Select
              value={intervalUnit}
              onValueChange={(value) => {
                const cron = applyCron("interval", { intervalUnit: value });
                onConfigChange({ intervalUnit: value, cron });
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="minutes">Menit</SelectItem>
                <SelectItem value="hours">Jam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-muted-foreground text-[11px]">
            Mis. setiap 5 menit, atau setiap 12 jam.
          </p>
        </TabsContent>

        <TabsContent value="daily" className="mt-3 flex flex-col gap-2">
          <Label className="text-muted-foreground text-xs font-medium">
            Setiap hari pada jam
          </Label>

          <Input
            type="time"
            value={dailyTime}
            onChange={(changeEvent) => {
              const cron = applyCron("daily", {
                dailyTime: changeEvent.target.value,
              });
              onConfigChange({ dailyTime: changeEvent.target.value, cron });
            }}
          />

          <p className="text-muted-foreground text-[11px]">
            Mis. kirim reminder setiap jam 09:00 pagi.
          </p>
        </TabsContent>

        <TabsContent value="weekly" className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs font-medium">
              Hari
            </Label>

            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs font-medium">
              Pada jam
            </Label>

            <Input
              type="time"
              value={weeklyTime}
              onChange={(changeEvent) => {
                const cron = applyCron("weekly", {
                  weeklyTime: changeEvent.target.value,
                });
                onConfigChange({ weeklyTime: changeEvent.target.value, cron });
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-border bg-muted/20 rounded-md border px-3 py-2">
        <span className="text-muted-foreground text-[11px]">
          Cron aktif:{" "}
          <code className="text-foreground font-mono">{currentCron}</code>
        </span>
      </div>
    </div>
  );
}
