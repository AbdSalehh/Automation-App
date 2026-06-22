import { LockIcon, UsersIcon, ScrollTextIcon } from "lucide-react";
import Image from "next/image";

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
    <div className="border-border/50 bg-card/50 fill-mode-backwards relative flex flex-col gap-5 overflow-hidden rounded-xl border p-5 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div className="from-primary/6 absolute inset-0 bg-linear-to-br to-transparent" />
      <div className="relative flex items-center gap-4">
        <div className="absolute size-35">
          <Image
            alt=""
            width={500}
            height={500}
            className="h-full! w-full! object-cover"
            src="/shield.webp"
          />
        </div>
        <div className="relative left-40 flex flex-col">
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
