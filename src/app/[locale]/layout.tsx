import type { Metadata, Viewport } from "next";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { FacebookChatDock } from "@/components/chat/facebook-chat-dock";
import { DockInset } from "@/components/layout/dock-inset";
import { SaveProgress } from "@/components/layout/save-progress";
import { ActivityTracker } from "@/components/activity/activity-tracker";
import { MessageAlerts } from "@/components/pwa/message-alerts";
import { YoutubeRouteStop } from "@/components/media/youtube-player";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { ProfileCompletionGuard } from "@/components/register/profile-completion-guard";
import { routing } from "@/i18n/routing";
import { inter, notoBengali, plusJakarta } from "@/lib/fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const locale = await getLocale();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: `%s · ${t("siteName")}`,
    },
    description: t("description"),
    applicationName: t("siteName"),
    appleWebApp: {
      capable: true,
      title: t("siteName"),
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: {
      canonical: locale === "en" ? "/en" : "/",
      languages: {
        bn: "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "bn" ? "bn_BD" : "en_US",
      alternateLocale: locale === "bn" ? ["en_US"] : ["bn_BD"],
      type: "website",
      siteName: t("siteName"),
      url: locale === "en" ? "/en" : "/",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#1dbf73",
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("Nav");

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${plusJakarta.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          {t("skip")}
        </a>
        <NextIntlClientProvider>
          <DockInset />
          <ActivityTracker />
          <YoutubeRouteStop />
          <SaveProgress />
          <SiteHeader />
          <MessageAlerts />
          <PwaRegister>
            <main id="main" className="min-w-0 flex-1">
              {children}
            </main>
            <SiteFooter />
            <FacebookChatDock />
          </PwaRegister>
          <ProfileCompletionGuard />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
