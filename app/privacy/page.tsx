import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";
import {
  FolderIcon,
  PieChartIcon,
  ShieldIcon,
  UsersIcon,
  CookieIcon,
  UserCogIcon,
  PencilIcon,
  LockIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  DatabaseIcon,
  GlobeIcon,
  HeadphonesIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/shared/ui";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      type="privacy"
      title="Privacy Policy"
      intro="We are committed to protecting your privacy and data. This service is free, and we never sell your personal data."
      lastUpdated="June 20, 2026"
      cardTitle="Privacy Policy"
      cardDescription={`This policy explains how ${APP_NAME} collects, uses, stores, and protects your personal information when you use our service.`}
      sections={[
        {
          heading: "Information We Collect",
          icon: <FolderIcon className="size-5" />,
          iconClassName: "bg-orange-50 text-orange-600",
          body: [
            `We collect information that you provide directly as well as automatically when you use the ${APP_NAME} service.`,
            "This includes account information (name, email address, and profile photo from login providers such as Google) when you register.",
            "We also store workflow configurations, integration credentials (encrypted), execution logs, and technical data such as IP address, browser type, and access time for security and diagnostic purposes.",
          ],
        },
        {
          heading: "Use of Information",
          icon: <PieChartIcon className="size-5" />,
          iconClassName: "bg-rose-50 text-rose-500",
          body: [
            "The information we collect is used to provide, operate, improve, and secure our service.",
            "Data is used to run your automations reliably, display execution history, send service-related notifications, and prevent abuse.",
            "We do not use your User Content for advertising purposes.",
          ],
        },
        {
          heading: "Data Storage & Security",
          icon: <ShieldIcon className="size-5" />,
          iconClassName: "bg-emerald-50 text-emerald-600",
          body: [
            "We apply technical and organizational security measures to protect your data from unauthorized access, alteration, or disclosure.",
            "Third-party credentials you connect (e.g. bot tokens, API keys) are stored in encrypted form and are never displayed again in full.",
            "Although we strive to protect your data, no method of electronic transmission or storage is completely secure.",
          ],
        },
        {
          heading: "Data Retention",
          icon: <DatabaseIcon className="size-5" />,
          iconClassName: "bg-sky-50 text-sky-600",
          body: [
            "We retain your data for as long as your account is active or as needed to provide the service.",
            "When you delete a workflow, credential, or account, the related data will be removed from our active systems, except where some must be retained to comply with legal obligations.",
          ],
        },
        {
          heading: "Sharing of Information",
          icon: <UsersIcon className="size-5" />,
          iconClassName: "bg-blue-50 text-blue-600",
          body: [
            "We do not sell your personal data to anyone.",
            "Information is shared only on a limited basis with the third-party services you connect for the purpose of node execution, or when required by law.",
          ],
        },
        {
          heading: "Third-Party Services",
          icon: <ExternalLinkIcon className="size-5" />,
          iconClassName: "bg-indigo-50 text-indigo-600",
          body: [
            `${APP_NAME} integrates with third-party services such as Google, Telegram, WhatsApp, and AI providers. When you run an automation, the relevant data is sent to those services according to your configuration.`,
            "Data processing by third-party providers is subject to their respective privacy policies. We recommend that you review their policies.",
          ],
        },
        {
          heading: "Cookies & Tracking Technologies",
          icon: <CookieIcon className="size-5" />,
          iconClassName: "bg-amber-50 text-amber-600",
          body: [
            "We use cookies and similar technologies to authenticate your session, remember preferences, and improve the usage experience.",
            "You can configure your browser to reject cookies, but some features may not work properly.",
          ],
        },
        {
          heading: "Your Rights",
          icon: <UserCogIcon className="size-5" />,
          iconClassName: "bg-orange-50 text-orange-600",
          body: [
            "You have the right to access, update, export, or delete your personal data through the settings page.",
            "You may also revoke third-party integration access at any time by deleting the related credentials.",
          ],
        },
        {
          heading: "Children's Privacy",
          icon: <UserCheckIcon className="size-5" />,
          iconClassName: "bg-teal-50 text-teal-600",
          body: [
            `${APP_NAME} is not intended for children under the age of 13, and we do not knowingly collect personal data from children.`,
          ],
        },
        {
          heading: "Changes to the Policy",
          icon: <PencilIcon className="size-5" />,
          iconClassName: "bg-purple-50 text-purple-600",
          body: [
            "We may update this privacy policy from time to time. Material changes will be announced on this page along with the date of the update.",
          ],
        },
      ]}
      summaryTitle="Summary of Our Commitments"
      summarySubtitle="Your privacy and data security are our top priorities."
      summaryCards={[
        {
          icon: <LockIcon className="size-6" />,
          iconClassName: "bg-emerald-50 text-emerald-600",
          title: "Protect Your Data",
          text: "Layered security to protect your data.",
        },
        {
          icon: <ShieldCheckIcon className="size-6" />,
          iconClassName: "bg-blue-50 text-blue-600",
          title: "Transparent",
          text: "We are open about how we use data.",
        },
        {
          icon: <UserCheckIcon className="size-6" />,
          iconClassName: "bg-purple-50 text-purple-600",
          title: "Full Control",
          text: "You have control over your data.",
        },
        {
          icon: <DatabaseIcon className="size-6" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "No Data Selling",
          text: "We do not sell your personal information.",
        },
        {
          icon: <GlobeIcon className="size-6" />,
          iconClassName: "bg-sky-50 text-sky-600",
          title: "Compliance",
          text: "We comply with global privacy standards.",
        },
      ]}
      callToAction={
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <HeadphonesIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">Questions About Privacy?</h3>
              <p className="text-muted-foreground text-sm">
                If you have questions about our privacy policy, do not hesitate
                to contact us.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 border-orange-500 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
          >
            Contact Us
            <ExternalLinkIcon className="size-4" />
          </Button>
        </div>
      }
    />
  );
}
