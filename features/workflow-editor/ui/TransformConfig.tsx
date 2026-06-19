"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button, Input, Textarea } from "@/shared/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Label } from "@/shared/ui/label";
import { ExpressionInput } from "./ExpressionInput";
import type { VariableGroup } from "./VariablePicker";
import type { ExpressionContext } from "@/shared/lib/expression";

export interface TransformMapping {
  id: string;
  key: string;
  value: string;
}

interface TransformConfigProps {
  mode: string;
  mappings: TransformMapping[];
  code: string;
  variableGroups: VariableGroup[];
  previewContext?: ExpressionContext;
  onModeChange: (mode: string) => void;
  onMappingsChange: (next: TransformMapping[]) => void;
  onCodeChange: (next: string) => void;
}

const DEFAULT_CODE = `return {
  fullName: payload.firstName + " " + payload.lastName,
  email: payload.email,
  timestamp: $now.toISOString(),
};`;

/**
 * Configuration UI for the Transform node. Offers a key/value field mapper
 * (each value is an expression) and a raw JavaScript transform, mirroring
 * n8n's Edit Fields / Code split.
 */
export function TransformConfig({
  mode,
  mappings,
  code,
  variableGroups,
  previewContext,
  onModeChange,
  onMappingsChange,
  onCodeChange,
}: TransformConfigProps) {
  const updateMapping = (mappingId: string, patch: Partial<TransformMapping>) =>
    onMappingsChange(
      mappings.map((mapping) =>
        mapping.id === mappingId ? { ...mapping, ...patch } : mapping,
      ),
    );

  const addMapping = () =>
    onMappingsChange([...mappings, { id: uuidv4(), key: "", value: "" }]);

  const removeMapping = (mappingId: string) =>
    onMappingsChange(mappings.filter((mapping) => mapping.id !== mappingId));

  return (
    <Tabs
      value={mode === "code" ? "code" : "keyvalue"}
      onValueChange={onModeChange}
    >
      <TabsList className="w-full">
        <TabsTrigger value="keyvalue" className="flex-1">
          Key / Value
        </TabsTrigger>
        <TabsTrigger value="code" className="flex-1">
          JavaScript
        </TabsTrigger>
      </TabsList>

      <TabsContent value="keyvalue" className="mt-3 flex flex-col gap-3">
        {mappings.length === 0 && (
          <p className="text-muted-foreground text-xs">
            Belum ada field. Tambahkan minimal satu pemetaan.
          </p>
        )}

        {mappings.map((mapping) => (
          <div
            key={mapping.id}
            className="border-border bg-muted/20 flex flex-col gap-2 rounded-md border p-2"
          >
            <div className="flex items-center gap-2">
              <Input
                value={mapping.key}
                placeholder="namaField"
                className="h-8 text-xs"
                onChange={(changeEvent) =>
                  updateMapping(mapping.id, { key: changeEvent.target.value })
                }
              />

              <button
                type="button"
                onClick={() => removeMapping(mapping.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Hapus field"
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>

            <ExpressionInput
              value={mapping.value}
              placeholder="{{ payload.firstName }}"
              variableGroups={variableGroups}
              previewContext={previewContext}
              onChange={(next) => updateMapping(mapping.id, { value: next })}
            />
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={addMapping}
        >
          <PlusIcon className="size-4" />
          Tambah Field
        </Button>
      </TabsContent>

      <TabsContent value="code" className="mt-3">
        <Label className="text-muted-foreground mb-1 block text-xs font-medium">
          JavaScript Transform
        </Label>

        <Textarea
          rows={8}
          className="font-mono text-xs"
          value={code}
          placeholder={DEFAULT_CODE}
          onChange={(changeEvent) => onCodeChange(changeEvent.target.value)}
        />

        <p className="text-muted-foreground mt-1 text-xs">
          Akses data lewat <code className="font-mono">payload</code> dan{" "}
          <code className="font-mono">$now</code>. Kembalikan objek hasil dengan{" "}
          <code className="font-mono">return</code>.
        </p>
      </TabsContent>
    </Tabs>
  );
}
