import { AgentSettingsPanel } from "@/features/agent-settings";
import { AgentPipelineCanvas } from "@/features/agent-pipeline";
import { WhatsappLinkCard } from "@/features/whatsapp-qr-login";
import { ProfileForm, PasswordForm } from "@/features/account-settings";
import { Button } from "@/shared/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui";
import { requireUser } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";
import { ShieldCheckIcon } from "lucide-react";

/**
 * Halaman setelan pengguna dalam satu halaman mengalir (tanpa tab). Memuat
 * kartu ringkasan profil, form profil & keamanan, panel agen chat-action, dan
 * kartu penautan WhatsApp.
 */
export async function SettingsView() {
  const sessionUser = await requireUser();

  const account = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, image: true, passwordHash: true, email: true },
  });

  const hasPassword = Boolean(account?.passwordHash);
  const isAdmin = sessionUser.role === "admin";

  const initials = account?.name
    ? account.name.slice(0, 2).toUpperCase()
    : (account?.email?.slice(0, 2).toUpperCase() ?? "U");

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Pengaturan Akun
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola informasi akun, keamanan, dan integrasi Anda.
          </p>
        </header>

        {/* Kartu ringkasan profil */}
        <section className="border-border bg-card flex flex-col gap-6 rounded-xl border p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="border-border size-20 border-2">
              <AvatarImage
                src={account?.image ?? undefined}
                alt="User avatar"
              />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {account?.name || "Pengguna"}
                </span>
                <Badge
                  variant={isAdmin ? "warning" : "neutral"}
                  className="gap-1 uppercase"
                >
                  <ShieldCheckIcon className="size-3" />
                  {isAdmin ? "Admin" : "User"}
                </Badge>
              </div>
              <span className="text-muted-foreground text-sm">
                {account?.email}
              </span>
              <Badge variant="success" className="mt-1">
                Akun Aktif
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-semibold">
                Metode Login
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  G
                </span>
                <span className="text-muted-foreground max-w-[140px] truncate text-xs">
                  {account?.email}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs font-semibold">
                Terakhir Aktif
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">
                  Online
                </span>
              </div>
              <span className="text-muted-foreground text-xs">Sekarang</span>
            </div>

            <Button
              variant="outline"
              className="self-center border-orange-200 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
            >
              Kelola Paket
            </Button>
          </div>
        </section>

        {/* Profil & Keamanan */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
            <ProfileForm
              initialName={account?.name ?? ""}
              initialImage={account?.image ?? null}
            />

            <AgentSettingsPanel />

            <AgentPipelineCanvas />
          </div>

          <div className="flex flex-col gap-6">
            {hasPassword && <PasswordForm />}

            <WhatsappLinkCard />
          </div>
        </div>
      </div>
    </div>
  );
}
