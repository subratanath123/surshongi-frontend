"use client";

import { Suspense, useEffect, useState } from "react";
import { CircleHelp, ClipboardList, LayoutGrid, LogOut, Scissors, UserRound, X } from "lucide-react";
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

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

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
          <div className="relative z-50">
            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e4e6eb] text-[#0B184D]"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t("closeMenu") : t("menu")}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <LayoutGrid className="size-5" aria-hidden />
            </button>
            {menuOpen ? (
              <nav
                aria-label={t("menu")}
                className="absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)]"
              >
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
              <p className="text-2xl font-bold text-[#0B184D]">{t("menu")}</p>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full bg-[#e4e6eb] text-[#0B184D]"
                aria-label={t("closeMenu")}
                onClick={closeMenu}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="max-h-[min(32rem,70vh)] overflow-y-auto px-2 pb-2">
              {user ? (
                <Link href={`/u/${user.id}`} onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0B184D] text-sm font-bold text-white">
                    {name.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-[#0B184D]">{name}</span>
                  </span>
                </Link>
              ) : (
                <Link href="/register" onClick={closeMenu} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#0D8BFF]">
                    <UserRound className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-[#0B184D]">{t("register")}</span>
                    <span className="block text-[13px] leading-snug text-muted-foreground">{t("signInHint")}</span>
                  </span>
                </Link>
              )}
              <Link href="/how" onClick={closeMenu} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#0D8BFF]">
                  <CircleHelp className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#0B184D]">{t("how")}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{t("howHint")}</span>
                </span>
              </Link>
              <Link href="/editor" onClick={closeMenu} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#0D8BFF]">
                  <Scissors className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#0B184D]">{t("editor")}</span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{t("editorHint")}</span>
                </span>
              </Link>
              {user ? (
                <>
                  <Link href="/orders" onClick={closeMenu} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#0D8BFF]">
                      <ClipboardList className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[#0B184D]">{t("orders")}</span>
                      <span className="block text-[13px] leading-snug text-muted-foreground">{t("ordersHint")}</span>
                    </span>
                  </Link>
                  <Link href="/register" onClick={closeMenu} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#0D8BFF]">
                      <UserRound className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[#0B184D]">{t("editProfile")}</span>
                      <span className="block text-[13px] leading-snug text-muted-foreground">{t("editHint")}</span>
                    </span>
                  </Link>
                  {admin ? (
                    <Link href="/activity" onClick={closeMenu} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-[#f0f2f5]">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E7F3FF] text-[#0D8BFF]">
                        <ClipboardList className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-[#0B184D]">{t("activity")}</span>
                        <span className="block text-[13px] leading-snug text-muted-foreground">{t("activityHint")}</span>
                      </span>
                    </Link>
                  ) : null}
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
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-[#f0f2f5] disabled:opacity-60"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0f2f5] text-[#0B184D]">
                      <LogOut className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[#0B184D]">{leaving ? "…" : t("logout")}</span>
                      <span className="block text-[13px] leading-snug text-muted-foreground">{t("logoutHint")}</span>
                    </span>
                  </button>
                </>
              ) : null}
              <div className="mx-2 mt-1 flex items-center justify-between border-t border-border py-3">
                <span className="text-sm font-semibold text-[#0B184D]">{t("language")}</span>
                <LanguageToggle />
              </div>
            </div>
          </nav>
            ) : null}
          </div>
        </nav>
      </div>
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default"
          aria-label={t("closeMenu")}
          onClick={closeMenu}
        />
      ) : null}
    </header>
  );
}
