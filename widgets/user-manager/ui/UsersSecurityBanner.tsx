import {
  ShieldCheckIcon,
  LockIcon,
  UsersIcon,
  ScrollTextIcon,
} from "lucide-react";

interface SecurityHighlight {
  key: string;
  title: string;
  description: string;
  icon: typeof LockIcon;
}

const HIGHLIGHTS: SecurityHighlight[] = [
  {
    key: "encryption",
    title: "Data terenkripsi",
    description: "AES-256 Encryption",
    icon: LockIcon,
  },
  {
    key: "access",
    title: "Akses terkontrol",
    description: "Role-based Access",
    icon: UsersIcon,
  },
  {
    key: "audit",
    title: "Aktivitas tercatat",
    description: "Audit log lengkap",
    icon: ScrollTextIcon,
  },
];

/**
 * Banner footer dekoratif yang menegaskan komitmen keamanan data pengguna.
 */
export function UsersSecurityBanner() {
  return (
    <div className="border-border flex flex-col gap-5 rounded-xl border bg-linear-to-r from-orange-50/60 to-transparent p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-sm">
          <ShieldCheckIcon className="size-6" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-foreground text-sm font-bold">
            Keamanan data Anda adalah prioritas kami
          </h3>
          <p className="text-muted-foreground text-xs">
            Semua data pengguna dienkripsi dan dilindungi dengan standar
            keamanan tinggi.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {HIGHLIGHTS.map((highlight) => {
          const HighlightIcon = highlight.icon;

          return (
            <div key={highlight.key} className="flex items-center gap-2.5">
              <div className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                <HighlightIcon className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-xs font-semibold">
                  {highlight.title}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {highlight.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
