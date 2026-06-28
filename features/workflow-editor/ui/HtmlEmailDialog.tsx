"use client";

import { useState } from "react";
import { CodeIcon, EyeIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button, Textarea } from "@/shared/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { cn } from "@/shared/lib/utils";

interface HtmlEmailDialogProps {
  value: string;
  onChange: (html: string) => void;
}

const PLACEHOLDER_HTML = [
  '<div style="font-family: sans-serif; color: #111;">',
  "  <h1>Hello {{name}}</h1>",
  "  <p>Thank you for your order.</p>",
  "</div>",
].join("\n");

/**
 * Dialog editor HTML email dengan dua kolom: sumber HTML (Textarea) dan preview.
 * Preview dirender di dalam <iframe sandbox> tanpa allow-scripts agar aman dari
 * eksekusi skrip (XSS). Perubahan disimpan ke draft lokal dulu, lalu di-commit
 * saat tombol Simpan ditekan.
 */
export function HtmlEmailDialog({ value, onChange }: HtmlEmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftHtml, setDraftHtml] = useState(value);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftHtml(value);
    }

    setIsOpen(nextOpen);
  };

  const handleSave = () => {
    onChange(draftHtml);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full gap-2">
          <CodeIcon className="size-4" />
          {value ? "Edit HTML Template" : "Create HTML Template"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-3xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>HTML Email Template</AlertDialogTitle>
        </AlertDialogHeader>

        <Tabs defaultValue="code" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="code" className="gap-1.5">
              <CodeIcon className="size-3.5" />
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <EyeIcon className="size-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex flex-col gap-1.5">
            <Textarea
              value={draftHtml}
              onChange={(changeEvent) => setDraftHtml(changeEvent.target.value)}
              placeholder={PLACEHOLDER_HTML}
              className="h-80 resize-none font-mono text-xs"
            />

            <p className="text-muted-foreground text-xs">
              Supports {"{{template}}"} for dynamic data such as {"{{name}}"}.
            </p>
          </TabsContent>

          <TabsContent value="preview">
            <iframe
              title="Preview HTML email"
              sandbox=""
              srcDoc={draftHtml}
              className={cn(
                "border-border h-80 w-full rounded-md border bg-white",
              )}
            />
          </TabsContent>
        </Tabs>

        <AlertDialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>

          <Button type="button" onClick={handleSave}>
            Save Template
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
