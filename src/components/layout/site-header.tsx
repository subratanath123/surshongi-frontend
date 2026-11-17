"use client";

import { Suspense, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { HeaderSearch } from "@/components/layout/header-search";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { MessageAlerts } from "@/components/pwa/message-alerts";
import { pick } from "@/data/catalog";
import { Link, usePathname } from "@/i18n/navigation";
import { isAdminEmail } from "@/lib/admin";
import { setSessionUser, useCurrentUser } from "@/lib/community-store";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const name = user ? pick(locale, user.nameBn, user.name) : "";
  const admin = user ? isAdminEmail(user.email) : false;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-16 min-w-0 max-w-6xl flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-3 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5 sm:order-1"
          aria-label={t("home")}
          onClick={() => {
            setMenuOpen(false);
            window.dispatchEvent(new Event("sur-home-feed"));
          }}
        >
          <img src="/brand/logo-wordmark.png" alt="" className="h-8 w-auto sm:h-9" />
        </Link>

        <Suspense fallback={<div className="order-last h-12 w-full rounded-lg border border-border bg-white sm:order-2 sm:w-auto sm:flex-1" />}>
          <HeaderSearch className="order-last w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1" />
        </Suspense>

        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:order-3 sm:ml-0" aria-label={t("brand")}>
          <MessageAlerts />
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-[#0B184D]"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("closeMenu") : t("menu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </nav>
      </div>
      {menuOpen ? (
        <nav className="border-t border-border px-3 py-2" aria-label={t("menu")}>
          <div className="mx-auto flex max-w-6xl flex-col">
            {user ? (
              <Link
                href={`/u/${user.id}`}
                onClick={closeMenu}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#0B184D] hover:bg-secondary"
              >
                <span className="grid size-7 place-items-center rounded-full bg-[#0B184D] text-[11px] font-bold text-white">
                  {name.slice(0, 1)}
                </span>
                <span className="truncate">{name}</span>
              </Link>
            ) : (
              <Link
                href="/register"
                onClick={closeMenu}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0D8BFF] hover:bg-secondary"
              >
                {t("register")}
              </Link>
            )}
            <Link href="/how" onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0B184D] hover:bg-secondary">
              {t("how")}
            </Link>
            <Link href="/editor" onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0B184D] hover:bg-secondary">
              {t("editor")}
            </Link>
            {user ? (
              <>
                <Link href="/orders" onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0B184D] hover:bg-secondary">
                  {t("orders")}
                </Link>
                <Link href="/register" onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0B184D] hover:bg-secondary">
                  {t("editProfile")}
                </Link>
                {admin ? (
                  <Link href="/activity" onClick={closeMenu} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#0B184D] hover:bg-secondary">
                    {t("activity")}
                  </Link>
                ) : null}
              </>
            ) : null}
            <div className="px-3 py-2">
              <LanguageToggle />
            </div>
            {user ? (
              <button
                type="button"
                disabled={leaving}
                onClick={() => {
                  setLeaving(true);
                  void setSessionUser(null).finally(() => {
                    setLeaving(false);
                    closeMenu();
                  });
                }}
                className="flex min-h-11 items-center rounded-lg px-3 text-left text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-60"
              >
                {leaving ? "…" : t("logout")}
              </button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
