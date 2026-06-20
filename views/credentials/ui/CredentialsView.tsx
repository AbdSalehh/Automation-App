import { CredentialManager } from "@/widgets/credential-manager";
import { WhatsappLinkCard } from "@/features/whatsapp-qr-login";

export function CredentialsView() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <CredentialManager />

      <div className="max-w-md">
        <WhatsappLinkCard />
      </div>
    </div>
  );
}
