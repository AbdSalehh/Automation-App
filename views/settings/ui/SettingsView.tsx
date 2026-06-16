import { AgentPipelineCanvas } from "@/features/agent-pipeline";
import { AgentSettingsPanel } from "@/features/agent-settings";
import { WhatsappQrLogin } from "@/features/whatsapp-qr-login";

/**
 * Halaman setelan pengguna. Menampilkan panel aktivasi agen chat-action
 * (Telegram + Gemini), kanvas read-only alur agen sebagai pemicu sistem, serta
 * koneksi akun WhatsApp yang khusus dipakai node WhatsApp di workflow.
 */
export function SettingsView() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Setelan Agen</h1>
        <p className="text-sm text-muted-foreground">
          Aktifkan agen chat-action lewat Telegram, lalu kirim pesan ke bot Anda
          untuk membuat & menjalankan otomasi.
        </p>
      </header>

      <section className="max-w-2xl">
        <AgentSettingsPanel />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Alur Agen (read-only)
        </h2>
        <AgentPipelineCanvas />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Akun WhatsApp (untuk node WhatsApp)
        </h2>
        <p className="text-xs text-muted-foreground">
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
