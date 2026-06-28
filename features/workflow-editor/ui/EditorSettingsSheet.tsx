"use client";

import { useEffect } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/shared/ui/sheet";
import { Switch } from "@/shared/ui/switch";
import { Slider } from "@/shared/ui/slider";
import { Label } from "@/shared/ui/label";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  toast,
} from "@/shared/ui";
import {
  useUserSettingStore,
  CONNECTION_MODE_OPTIONS,
  type ConnectionMode,
} from "@/entities/user-setting";

interface EditorSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Baris setelan on/off dengan label dan deskripsi singkat. */
function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <Label className="text-sm">{label}</Label>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>

      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onValueChange: (value: number) => void;
}

/** Baris setelan numerik berbasis slider dengan nilai aktif di kanan. */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onValueChange,
}: SliderRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>

        <span className="text-muted-foreground text-xs tabular-nums">
          {value}
          {suffix}
        </span>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(nextValues) => onValueChange(nextValues[0])}
      />
    </div>
  );
}

/**
 * Panel geser (Sheet) untuk mengatur preferensi kanvas editor per-pengguna.
 * State dikelola di `useUserSettingStore`; perubahan field bersifat lokal
 * sampai pengguna menekan Simpan.
 */
export function EditorSettingsSheet({
  open,
  onOpenChange,
}: EditorSettingsSheetProps) {
  const {
    setting,
    isLoading,
    isSaving,
    fetchSetting,
    updateField,
    resetToDefault,
    saveSetting,
  } = useUserSettingStore();

  useEffect(() => {
    if (open) {
      fetchSetting();
    }
  }, [open, fetchSetting]);

  const handleSave = async () => {
    const success = await saveSetting();

    if (success) {
      toast.success("Editor settings saved.");
      onOpenChange(false);
    } else {
      toast.error("Failed to save settings.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editor Settings</SheetTitle>
          <SheetDescription>
            Customize the canvas appearance. These preferences apply only to
            your account.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
            <SliderRow
              label="Node Font Size"
              value={setting.fontSize}
              min={10}
              max={24}
              step={1}
              suffix="px"
              onValueChange={(value) => updateField("fontSize", value)}
            />

            <ToggleRow
              label="Show Grid"
              description="Show grid dots on the canvas background."
              checked={setting.showGrid}
              onCheckedChange={(checked) => updateField("showGrid", checked)}
            />

            <SliderRow
              label="Grid Size"
              value={setting.gridSize}
              min={8}
              max={64}
              step={2}
              suffix="px"
              onValueChange={(value) => updateField("gridSize", value)}
            />

            <ToggleRow
              label="Snap to Grid"
              description="Nodes snap to the grid when dragged."
              checked={setting.snapToGrid}
              onCheckedChange={(checked) => updateField("snapToGrid", checked)}
            />

            <ToggleRow
              label="Show Minimap"
              description="A small navigation map in the canvas corner."
              checked={setting.showMinimap}
              onCheckedChange={(checked) => updateField("showMinimap", checked)}
            />

            <ToggleRow
              label="Show Controls"
              description="Zoom and fit-view buttons."
              checked={setting.showControls}
              onCheckedChange={(checked) =>
                updateField("showControls", checked)
              }
            />

            <div className="flex flex-col gap-2">
              <Label className="text-sm">Connection Line Style</Label>

              <Select
                value={setting.connectionMode}
                onValueChange={(value) =>
                  updateField("connectionMode", value as ConnectionMode)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {CONNECTION_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SliderRow
              label="Run Animation Speed"
              value={setting.animationSpeed}
              min={100}
              max={2000}
              step={100}
              suffix="ms"
              onValueChange={(value) => updateField("animationSpeed", value)}
            />
          </div>
        )}

        <SheetFooter className="flex-row justify-between">
          <Button
            variant="ghost"
            onClick={resetToDefault}
            disabled={isSaving || isLoading}
          >
            Reset to Default
          </Button>

          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Spinner />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
