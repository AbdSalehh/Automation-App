"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";
import { CalendarDays, Plus, Trash2, Edit } from "lucide-react";

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

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatLocalDate(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatIndonesianDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const monthName = INDONESIAN_MONTHS[month - 1] ?? "";
  return `${day} ${monthName} ${year}`;
}

const HOURS_24 = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);

const MINUTES_60 = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);

interface ScheduleDateEntry {
  date: string;
  time: string;
}

type ScheduleMode = "interval" | "daily" | "weekly" | "dates";

/**
 * Builds a 5-field cron string from friendly inputs so non-technical users can
 * set recurring schedules (every N minutes/hours, daily at a time, or on chosen
 * weekdays) without writing cron syntax.
 */
export function ScheduleTriggerConfig({
  config,
  onConfigChange,
}: ScheduleTriggerConfigProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | undefined>(new Date());
  const [modalHour, setModalHour] = useState("09");
  const [modalMinute, setModalMinute] = useState("00");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const hoursContainerRef = useRef<HTMLDivElement>(null);
  const minutesContainerRef = useRef<HTMLDivElement>(null);
  const activeHourRef = useRef<HTMLButtonElement>(null);
  const activeMinuteRef = useRef<HTMLButtonElement>(null);

  const isProgrammaticScroll = useRef(false);

  const hoursTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minutesTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      isProgrammaticScroll.current = true;
      if (hoursTimerRef.current) clearTimeout(hoursTimerRef.current);
      if (minutesTimerRef.current) clearTimeout(minutesTimerRef.current);

      const timer = setTimeout(() => {
        if (hoursContainerRef.current && activeHourRef.current) {
          const container = hoursContainerRef.current;
          const active = activeHourRef.current;
          container.scrollTop =
            active.offsetTop -
            container.offsetHeight / 2 +
            active.offsetHeight / 2;
        }
        if (minutesContainerRef.current && activeMinuteRef.current) {
          const container = minutesContainerRef.current;
          const active = activeMinuteRef.current;
          container.scrollTop =
            active.offsetTop -
            container.offsetHeight / 2 +
            active.offsetHeight / 2;
        }
        setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 300);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleScrollHours = () => {
    if (isProgrammaticScroll.current) return;
    const container = hoursContainerRef.current;
    if (!container) return;

    if (hoursTimerRef.current) clearTimeout(hoursTimerRef.current);
    hoursTimerRef.current = setTimeout(() => {
      const containerCenter = container.scrollTop + container.offsetHeight / 2;
      let closestHour = "09";
      let minDistance = Infinity;

      const buttons = container.querySelectorAll("button");
      buttons.forEach((btn) => {
        const val = btn.getAttribute("data-value");
        if (!val) return;
        const buttonCenter = btn.offsetTop + btn.offsetHeight / 2;
        const distance = Math.abs(buttonCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestHour = val;
        }
      });

      setModalHour(closestHour);
    }, 100);
  };

  const handleScrollMinutes = () => {
    if (isProgrammaticScroll.current) return;
    const container = minutesContainerRef.current;
    if (!container) return;

    if (minutesTimerRef.current) clearTimeout(minutesTimerRef.current);
    minutesTimerRef.current = setTimeout(() => {
      const containerCenter = container.scrollTop + container.offsetHeight / 2;
      let closestMin = "00";
      let minDistance = Infinity;

      const buttons = container.querySelectorAll("button");
      buttons.forEach((btn) => {
        const val = btn.getAttribute("data-value");
        if (!val) return;
        const buttonCenter = btn.offsetTop + btn.offsetHeight / 2;
        const distance = Math.abs(buttonCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestMin = val;
        }
      });

      setModalMinute(closestMin);
    }, 100);
  };

  const handleSelectHour = (hourVal: string) => {
    if (hoursTimerRef.current) {
      clearTimeout(hoursTimerRef.current);
      hoursTimerRef.current = null;
    }

    setModalHour(hourVal);
    isProgrammaticScroll.current = true;

    const container = hoursContainerRef.current;
    if (container) {
      const btn = container.querySelector(
        `button[data-value="${hourVal}"]`,
      ) as HTMLButtonElement | null;
      if (btn) {
        container.scrollTop =
          btn.offsetTop - container.offsetHeight / 2 + btn.offsetHeight / 2;
      }
    }

    // lock programmatic flag for 350ms to let browser scroll animation finish
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 350);
  };

  const handleSelectMinute = (minuteVal: string) => {
    if (minutesTimerRef.current) {
      clearTimeout(minutesTimerRef.current);
      minutesTimerRef.current = null;
    }

    setModalMinute(minuteVal);
    isProgrammaticScroll.current = true;

    const container = minutesContainerRef.current;
    if (container) {
      const btn = container.querySelector(
        `button[data-value="${minuteVal}"]`,
      ) as HTMLButtonElement | null;
      if (btn) {
        container.scrollTop =
          btn.offsetTop - container.offsetHeight / 2 + btn.offsetHeight / 2;
      }
    }

    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 350);
  };

  const handleAddNew = () => {
    setEditingIndex(null);
    setModalDate(new Date());
    setModalHour("09");
    setModalMinute("00");
    setIsModalOpen(true);
  };

  const handleEdit = (entryIndex: number) => {
    const entry = scheduleDates[entryIndex];
    if (!entry) return;

    setEditingIndex(entryIndex);

    const [year, month, day] = entry.date.split("-").map(Number);
    setModalDate(new Date(year, month - 1, day));

    const [hour24, minuteStr] = entry.time.split(":");
    setModalHour(hour24);
    setModalMinute(minuteStr);
    setIsModalOpen(true);
  };

  const handleDelete = (entryIndex: number) => {
    const nextDates = scheduleDates.filter((_, index) => index !== entryIndex);
    onConfigChange({ scheduleDates: nextDates, cron: "" });
  };

  const handleSaveDate = () => {
    if (!modalDate) return;

    const time24 = `${modalHour}:${modalMinute}`;
    const dateStr = formatLocalDate(modalDate);
    const newEntry = { date: dateStr, time: time24 };

    const nextDates = [...scheduleDates];
    if (editingIndex === null) {
      nextDates.push(newEntry);
    } else {
      nextDates[editingIndex] = newEntry;
    }

    nextDates.sort((firstItem, secondItem) => {
      const dateComparison = firstItem.date.localeCompare(secondItem.date);
      if (dateComparison !== 0) return dateComparison;
      return firstItem.time.localeCompare(secondItem.time);
    });

    onConfigChange({ scheduleDates: nextDates, cron: "" });
    setIsModalOpen(false);
  };

  const scheduleMode = (String(config.scheduleMode ?? "daily") ||
    "daily") as ScheduleMode;

  const intervalUnit = String(config.intervalUnit ?? "minutes");
  const intervalEvery = Number(config.intervalEvery ?? 5);
  const dailyTime = String(config.dailyTime ?? "09:00");
  const weeklyTime = String(config.weeklyTime ?? "09:00");

  const selectedDays = Array.isArray(config.weeklyDays)
    ? (config.weeklyDays as string[])
    : ["1"];

  const scheduleDates = Array.isArray(config.scheduleDates)
    ? (config.scheduleDates as ScheduleDateEntry[])
    : [];

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

    if (mode === "dates") {
      cron = "";
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
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="dates" className="flex-1">
            Dates
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

        <TabsContent value="dates" className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs font-semibold">
              Specific Date Schedules
            </Label>
            <button
              type="button"
              onClick={handleAddNew}
              className="text-primary flex items-center gap-1 text-[11px] font-semibold hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add Schedule
            </button>
          </div>

          {scheduleDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center">
              <CalendarDays className="mb-1.5 h-8 w-8 text-slate-300" />
              <span className="text-xs font-medium text-slate-500">
                No schedules yet
              </span>
              <span className="text-[10px] text-slate-400">
                Click "Add Schedule" to begin
              </span>
            </div>
          ) : (
            <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
              {scheduleDates.map((entry, entryIndex) => (
                <div
                  key={`${entry.date}-${entry.time}-${entryIndex}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-2.5 shadow-2xs transition-colors hover:border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-700">
                        {formatIndonesianDate(entry.date)}
                      </span>
                      <span className="text-primary text-[10px] font-bold">
                        ⏱️ {entry.time} WIB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(entryIndex)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entryIndex)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog
            open={isModalOpen}
            onOpenChange={(openState) => setIsModalOpen(openState)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingIndex === null
                    ? "Add Schedule & Time"
                    : "Edit Schedule & Time"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white py-0 shadow-sm outline-none md:flex-row md:items-stretch">
                {/* Left Column: Calendar with Clear/Today (no border or shadows on its own) */}
                <div className="flex shrink-0 flex-col justify-between p-4 select-none">
                  <Calendar
                    mode="single"
                    selected={modalDate}
                    onSelect={(selectedDay) =>
                      selectedDay && setModalDate(selectedDay)
                    }
                    classNames={{
                      today:
                        "bg-transparent text-[#F95A02] font-semibold rounded-md border border-[#F95A02]/30",
                      selected:
                        "bg-[#F95A02] text-white rounded-md hover:bg-[#F95A02]/90",
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between px-2 py-1 text-xs font-semibold text-[#F95A02]">
                    <button
                      type="button"
                      onClick={() => setModalDate(undefined)}
                      className="hover:underline"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalDate(new Date())}
                      className="hover:underline"
                    >
                      Today
                    </button>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden border-r border-[#E2E8F0] md:block" />

                {/* Right Column: Time scroll wheels (no inner borders) */}
                <div className="relative flex w-full flex-col items-center bg-white p-4 md:w-[240px]">
                  <div className="z-10 mb-2 flex w-full justify-around select-none">
                    <span className="text-xs font-medium text-slate-400">
                      Hour
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Minute
                    </span>
                  </div>

                  <div className="relative flex h-64 w-full items-center justify-center gap-3 overflow-hidden">
                    {/* Active highlighted horizontal bar across columns */}
                    <div className="pointer-events-none absolute inset-x-0 top-[108px] h-10 border-y border-[#FFEAE0]/70 bg-[#FFF6F0]" />

                    {/* Hours list scroll */}
                    <div
                      ref={hoursContainerRef}
                      onScroll={handleScrollHours}
                      className="no-scrollbar relative z-10 h-64 w-12 snap-y snap-mandatory space-y-0.5 overflow-y-auto scroll-smooth"
                      style={{ scrollbarWidth: "none" }}
                    >
                      <div className="h-[108px] shrink-0" />
                      {HOURS_24.map((hourValue) => {
                        const isSelectedHour = modalHour === hourValue;
                        return (
                          <button
                            key={hourValue}
                            ref={isSelectedHour ? activeHourRef : null}
                            type="button"
                            data-value={hourValue}
                            onClick={() => handleSelectHour(hourValue)}
                            className={cn(
                              "relative flex h-10 w-full shrink-0 snap-center items-center justify-center rounded-md text-center text-sm transition-colors",
                              isSelectedHour
                                ? "font-bold text-[#F95A02]"
                                : "font-normal text-slate-500 hover:text-slate-900",
                            )}
                          >
                            {hourValue}
                          </button>
                        );
                      })}
                      <div className="h-[108px] shrink-0" />
                    </div>

                    {/* Middle Separator Colon */}
                    <span className="z-20 text-sm font-bold text-[#F95A02] select-none">
                      :
                    </span>

                    {/* Minutes list scroll */}
                    <div
                      ref={minutesContainerRef}
                      onScroll={handleScrollMinutes}
                      className="no-scrollbar relative z-10 h-64 w-12 snap-y snap-mandatory space-y-0.5 overflow-y-auto scroll-smooth"
                      style={{ scrollbarWidth: "none" }}
                    >
                      <div className="h-[108px] shrink-0" />
                      {MINUTES_60.map((minuteValue) => {
                        const isSelectedMinute = modalMinute === minuteValue;
                        return (
                          <button
                            key={minuteValue}
                            ref={isSelectedMinute ? activeMinuteRef : null}
                            type="button"
                            data-value={minuteValue}
                            onClick={() => handleSelectMinute(minuteValue)}
                            className={cn(
                              "relative flex h-10 w-full shrink-0 snap-center items-center justify-center rounded-md text-center text-sm transition-colors",
                              isSelectedMinute
                                ? "font-bold text-[#F95A02]"
                                : "font-normal text-slate-500 hover:text-slate-900",
                            )}
                          >
                            {minuteValue}
                          </button>
                        );
                      })}
                      <div className="h-[108px] shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDate}
                    className="bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                    disabled={!modalDate}
                  >
                    Save
                  </button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <div className="border-border bg-muted/20 rounded-md border px-3 py-2">
        <span className="text-muted-foreground text-[11px]">
          Active cron:{" "}
          <code className="text-foreground font-mono">{currentCron}</code>
        </span>
      </div>
    </div>
  );
}
