"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  CONDITION_OPERATOR_LABELS,
  VALUELESS_OPERATORS,
  type ConditionGroup,
  type ConditionRule,
  type ConditionOperator,
} from "@/entities/workflow";
import { cn } from "@/shared/lib/utils";

interface ConditionBuilderProps {
  value: ConditionGroup;
  availableColumns: string[];
  /** Returns distinct values for a column so the value field can be a dropdown. */
  getColumnValues?: (column: string) => string[];
  onChange: (next: ConditionGroup) => void;
}

const EMPTY_RULE: ConditionRule = {
  field: "",
  operator: "equals",
  value: "",
};

/**
 * Visual builder for structured conditions. Lets users pick a column, an
 * operator, and a comparison value without writing code.
 */
export function ConditionBuilder({
  value,
  availableColumns,
  getColumnValues,
  onChange,
}: ConditionBuilderProps) {
  const rules = value.rules ?? [];

  const updateMatch = (match: "all" | "any") => onChange({ ...value, match });

  const updateRule = (ruleIndex: number, patch: Partial<ConditionRule>) =>
    onChange({
      ...value,
      rules: rules.map((rule, index) =>
        index === ruleIndex ? { ...rule, ...patch } : rule,
      ),
    });

  const addRule = () =>
    onChange({ ...value, rules: [...rules, { ...EMPTY_RULE }] });

  const removeRule = (ruleIndex: number) =>
    onChange({
      ...value,
      rules: rules.filter((_, index) => index !== ruleIndex),
    });

  return (
    <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-md border p-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span>Cocokkan</span>

        <Select
          value={value.match}
          onValueChange={(matchValue) =>
            updateMatch(matchValue as "all" | "any")
          }
        >
          <SelectTrigger size="sm" className="w-auto">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">SEMUA (AND)</SelectItem>
            <SelectItem value="any">SALAH SATU (OR)</SelectItem>
          </SelectContent>
        </Select>

        <span>kondisi berikut:</span>
      </div>

      {rules.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Belum ada kondisi. Tambahkan minimal satu.
        </p>
      )}

      {rules.map((rule, ruleIndex) => {
        const needsValue = !VALUELESS_OPERATORS.includes(rule.operator);

        return (
          <div
            key={ruleIndex}
            className="border-border bg-card flex flex-col gap-2 rounded-md border p-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                Kolom
              </span>

              <Select
                value={rule.field || "_none"}
                onValueChange={(fieldValue) =>
                  updateRule(ruleIndex, {
                    field: fieldValue === "_none" ? "" : fieldValue,
                  })
                }
              >
                <SelectTrigger size="sm" className="flex-1">
                  <SelectValue placeholder="— pilih kolom —" />
                </SelectTrigger>

                <SelectContent>
                  {availableColumns.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Belum ada kolom
                    </SelectItem>
                  ) : (
                    availableColumns.map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => removeRule(ruleIndex)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Hapus kondisi"
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>

            <Select
              value={rule.operator}
              onValueChange={(operatorValue) =>
                updateRule(ruleIndex, {
                  operator: operatorValue as ConditionOperator,
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {(
                  Object.keys(CONDITION_OPERATOR_LABELS) as ConditionOperator[]
                ).map((operator) => (
                  <SelectItem key={operator} value={operator}>
                    {CONDITION_OPERATOR_LABELS[operator]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {needsValue &&
              (() => {
                const columnValues = getColumnValues
                  ? getColumnValues(rule.field)
                  : [];

                const datalistId = `condition-values-${ruleIndex}`;

                return (
                  <>
                    <Input
                      className={cn("h-8 text-xs")}
                      list={columnValues.length > 0 ? datalistId : undefined}
                      placeholder="nilai pembanding (mis. Belum Dibayar)"
                      value={rule.value ?? ""}
                      onChange={(changeEvent) =>
                        updateRule(ruleIndex, {
                          value: changeEvent.target.value,
                        })
                      }
                    />

                    {columnValues.length > 0 && (
                      <datalist id={datalistId}>
                        {columnValues.map((columnValue) => (
                          <option key={columnValue} value={columnValue} />
                        ))}
                      </datalist>
                    )}
                  </>
                );
              })()}
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={addRule}
      >
        <PlusIcon className="size-4" />
        Tambah Kondisi
      </Button>
    </div>
  );
}
