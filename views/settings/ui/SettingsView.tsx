import { AgentPipelineCanvas } from "@/features/agent-pipeline";
import { AgentSettingsPanel } from "@/features/agent-settings";
import { WhatsappQrLogin } from "@/features/whatsapp-qr-login";
import { ProfileForm, PasswordForm } from "@/features/account-settings";
import { MotionSection } from "@/shared/ui";
import { requireUser } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";

/**
 * Halaman setelan pengguna. Menampilkan profil akun (nama, foto, password),
 * panel aktivasi agen chat-action (Telegram + Gemini), kanvas read-only alur
 * agen, serta koneksi akun WhatsApp untuk node WhatsApp di workflow.
 */
export async function SettingsView() {
  const sessionUser = await requireUser();

  const account = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, image: true, passwordHash: true },
  });

  const hasPassword = Boolean(account?.passwordHash);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-foreground text-2xl font-bold">Setelan</h1>
        <p className="text-muted-foreground text-sm">
          Kelola profil akun Anda, lalu aktifkan agen chat-action lewat Telegram
          untuk membuat & menjalankan otomasi.
        </p>
      </header>

      <MotionSection
        as="section"
        className="grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2"
      >
        <ProfileForm
          initialName={account?.name ?? ""}
          initialImage={account?.image ?? null}
        />

        {hasPassword && <PasswordForm />}
      </MotionSection>

      <MotionSection as="section" className="max-w-2xl">
        <AgentSettingsPanel />
      </MotionSection>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-sm font-semibold">
          Alur Agen (read-only)
        </h2>
        <AgentPipelineCanvas />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-sm font-semibold">
          Akun WhatsApp (untuk node WhatsApp)
        </h2>
        <p className="text-muted-foreground text-xs">
          Scan QR ini hanya jika Anda memakai node WhatsApp di dalam workflow.
          Tidak wajib untuk agen chat-action.
        </p>
        <div className="max-w-md">
          <WhatsappQrLogin />
        </div>
      </section>
    </div>
  );
}
