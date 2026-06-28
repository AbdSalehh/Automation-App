import type { Metadata } from "next";
import { LegalPage } from "@/views/legal";
import { APP_NAME } from "@/shared/config/constants";
import {
  UserIcon,
  ShieldCheckIcon,
  GiftIcon,
  LockIcon,
  PencilIcon,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/shared/ui";

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <LegalPage
      type="terms"
      title="Terms of Service"
      intro={`Terms and conditions for using the ${APP_NAME} service. ${APP_NAME} is a free service.`}
      lastUpdated="June 20, 2026"
      cardTitle="Terms of Service"
      cardDescription={`Terms and conditions for using the ${APP_NAME} service. Please read them carefully before using our service.`}
      sections={[
        {
          heading: "Introduction",
          body: [
            `Welcome to ${APP_NAME}. By accessing or using our service, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our service.`,
            `${APP_NAME} is a cloud-based workflow automation platform that lets you visually build, run, and manage workflows.`,
            `${APP_NAME} is provided free of charge. We do not charge any fees for using this service.`,
          ],
        },
        {
          heading: "Definitions",
          body: [
            `"Service" refers to the ${APP_NAME} platform, including the website, the workflow editor interface, the execution engine, and all related features.`,
            `"User" is an individual or entity that creates an account and uses the Service. "User Content" is all data, workflow configurations, credentials, and information that you enter into the Service.`,
          ],
        },
        {
          heading: "User Account",
          body: [
            `To use the ${APP_NAME} service, you must create an account. You are responsible for keeping your account information confidential and for all activity that occurs under your account.`,
            "You agree to notify us immediately of any unauthorized use of your account. Accounts registered through Google may require administrator approval before they can be used.",
          ],
        },
        {
          heading: `The ${APP_NAME} Service`,
          body: [
            `${APP_NAME} provides tools to build workflows, integrate with third-party services, run automations, store configurations, and other features at no cost.`,
            "We reserve the right to modify, suspend, or discontinue part or all of the service at any time. Because this service is free, we do not guarantee uninterrupted availability and may apply reasonable usage limits to maintain system stability.",
          ],
        },
        {
          heading: "User Content",
          body: [
            "You retain all rights to the User Content you enter. You grant us a limited license to process and store that content solely to operate the Service for you.",
            "You are fully responsible for the legality and accuracy of your User Content, as well as for the actions your automations perform against third-party services.",
          ],
        },
        {
          heading: "Third-Party Integrations",
          body: [
            `${APP_NAME} can connect with third-party services (e.g. Telegram, WhatsApp, Google, and AI providers) using the credentials you provide.`,
            "Use of third-party services is subject to the terms and policies of each provider. We are not responsible for changes, restrictions, or disruptions to those third-party services.",
          ],
        },
        {
          heading: "Prohibited Use",
          body: [
            `You agree not to use ${APP_NAME} for illegal or fraudulent purposes, to harm others, or to infringe the rights of third parties.`,
            "You may not use the service to send spam or malware, perform scraping that violates terms, or carry out activities that may disrupt, overload, or damage our systems or other users.",
          ],
        },
        {
          heading: "Ownership & Intellectual Property Rights",
          body: [
            `All content, trademarks, logos, and technology contained within ${APP_NAME} are owned by us or our licensors and are protected by copyright and intellectual property laws.`,
            "You are granted a limited, non-exclusive, and revocable license to use our service in accordance with these Terms of Service.",
          ],
        },
        {
          heading: "Limitation of Liability",
          body: [
            `The service is provided "as is" without warranties of any kind. Because ${APP_NAME} is free, to the extent permitted by law, we are not liable for any direct or indirect damages arising from the use of or inability to use the service.`,
            "You use the automations you create at your own risk, including their impact on the data and third-party accounts you connect.",
          ],
        },
        {
          heading: "Termination",
          body: [
            "We may suspend or terminate your access if you violate these Terms of Service or misuse the service.",
            "You may stop using the service and delete your account at any time through the settings page.",
          ],
        },
        {
          heading: "Changes to the Terms & Governing Law",
          body: [
            "We may update these Terms of Service from time to time. Material changes will be announced on this page. Continued use after changes means you accept the updated terms.",
            "These Terms of Service are governed by the laws in force in the Republic of Indonesia.",
          ],
        },
      ]}
      summaryTitle="Summary of Key Terms"
      summarySubtitle="Here are the important points you should know."
      summaryCards={[
        {
          icon: <UserIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Your Account",
          text: "You are responsible for the security of your account and any activity that occurs.",
        },
        {
          icon: <ShieldCheckIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Fair Use",
          text: "Use the service legally and do not infringe the rights of others.",
        },
        {
          icon: <GiftIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Free",
          text: "This service is provided at no cost.",
        },
        {
          icon: <LockIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-600",
          title: "Data Security",
          text: "We protect the security of your data in accordance with the privacy policy.",
        },
        {
          icon: <PencilIcon className="size-4" />,
          iconClassName: "bg-orange-50 text-orange-500",
          title: "Changes",
          text: "We may change the terms at any time with notice.",
        },
      ]}
      callToAction={null}
    />
  );
}
