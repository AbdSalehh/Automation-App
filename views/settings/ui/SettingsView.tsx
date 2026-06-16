import { AgentPipelineCanvas } from "@/features/agent-pipeline";
import { WhatsappQrLogin } from "@/features/whatsapp-qr-login";

/**
 * Halaman setelan pengguna. Menampilkan kanvas read-only alur agen chat-action
 * sebagai pemicu sistem, beserta kartu koneksi akun WhatsApp agen.
 */
export function SettingsView() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Setelan Agen</h1>
        <p className="text-sm text-muted-foreground">
          Alur agen chat-action di bawah ini adalah pemicu sistem dan tidak
          dapat diedit. Hubungkan akun WhatsApp agen untuk mulai menerima pesan.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Alur Agen (read-only)
        </h2>
        <AgentPipelineCanvas />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Akun WhatsApp Agen
        </h2>
        <div className="max-w-md">
          <WhatsappQrLogin />
        </div>
      </section>
    </div>
  );
}
