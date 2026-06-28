"use client";

import { useRef } from "react";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { Input, Textarea } from "@/shared/ui";
import { VariablePicker, type VariableGroup } from "./VariablePicker";
import {
  resolveExpression,
  evaluateExpression,
  hasExpression,
  type ExpressionContext,
} from "@/shared/lib/expression";
import { cn } from "@/shared/lib/utils";

interface ExpressionInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
  /** Variable groups offered by the picker. */
  variableGroups: VariableGroup[];
  /** Sample context used to render the live preview. */
  previewContext?: ExpressionContext;
  /** When true, treat the whole value as a raw JS expression (Code mode). */
  rawExpression?: boolean;
  className?: string;
}

/**
 * Text/textarea input with a Variable Picker and a live evaluated preview.
 * In template mode it resolves `{{ ... }}` placeholders; in raw mode it
 * evaluates the entire value as a single JavaScript expression.
 */
export function ExpressionInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  variableGroups,
  previewContext,
  rawExpression = false,
  className,
}: ExpressionInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  /** Live preview is computed during render (React Compiler memoizes it). */
  const computePreview = (): { text: string; hasError: boolean } => {
    const context = previewContext ?? { payload: {} };

    if (!value) {
      return { text: "", hasError: false };
    }

    if (rawExpression) {
      const result = evaluateExpression(value, context);

      return {
        text: result === undefined ? "undefined" : String(result),
        hasError: result === undefined,
      };
    }

    return { text: resolveExpression(value, context), hasError: false };
  };

  const { text: preview, hasError } = computePreview();

  /** Inserts a variable at the cursor, wrapping in {{ }} unless in raw mode. */
  const handleInsert = (variable: string) => {
    const token = rawExpression ? variable : `{{ ${variable} }}`;
    const element = inputRef.current;

    if (!element) {
      onChange(value + token);
      return;
    }

    const start = element.selectionStart ?? value.length;
    const end = element.selectionEnd ?? value.length;

    const nextValue = value.slice(0, start) + token + value.slice(end);
    onChange(nextValue);

    /** Restore focus and place the cursor after the inserted token. */
    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + token.length;
      element.setSelectionRange(cursor, cursor);
    });
  };

  const showPreview = Boolean(value) && (rawExpression || hasExpression(value));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {multiline ? (
            <Textarea
              ref={inputRef as React.Ref<HTMLTextAreaElement>}
              rows={4}
              className={cn("font-mono text-xs", className)}
              value={value}
              placeholder={placeholder}
              onChange={(changeEvent) => onChange(changeEvent.target.value)}
            />
          ) : (
            <Input
              ref={inputRef as React.Ref<HTMLInputElement>}
              className={cn("font-mono text-xs", className)}
              value={value}
              placeholder={placeholder}
              onChange={(changeEvent) => onChange(changeEvent.target.value)}
            />
          )}
        </div>

        <VariablePicker
          groups={variableGroups}
          onInsert={handleInsert}
          className="mt-0.5 shrink-0"
        />
      </div>

      {showPreview && (
        <div
          className={cn(
            "flex items-start gap-1.5 rounded-md border px-2 py-1.5 text-[11px]",
            hasError
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {hasError ? (
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
          )}

          <span className="break-all">
            <span className="font-medium">Preview: </span>
            {preview || "(empty)"}
          </span>
        </div>
      )}
    </div>
  );
}
