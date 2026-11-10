import * as React from "react";

import { InfoTooltip } from "@/shared/ui";

interface ConfigFieldLabelProps {
  children: string;
  /** Penjelasan opsional, ditampilkan lewat ikon info di samping label. */
  hint?: React.ReactNode;
  htmlFor?: string;
}

/**
 * Label field di panel konfigurasi node. Bila ada `hint`, penjelasannya
 * dipindah ke tooltip agar panel tidak dipenuhi paragraf bantuan.
 */
export function ConfigFieldLabel({
  children,
  hint,
  htmlFor,
}: ConfigFieldLabelProps) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-muted-foreground block text-xs font-medium"
      >
        {children}
      </label>

      {hint && <InfoTooltip content={hint} label={`About ${children}`} />}
    </div>
  );
}
