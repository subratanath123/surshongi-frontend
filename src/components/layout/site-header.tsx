"use client";

import { useState } from "react";
import { CircleHelp, Scissors, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeaderAuthPill } from "@/components/layout/header-auth-pill";
import { HeaderSearch } from "@/components/layout/header-search";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Link } from "@/i18n/navigation";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const home = useTranslations("Home");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-16 min-w-0 max-w-6xl items-center gap-2 px-3 sm:gap-4 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5"
          aria-label={t("home")}
          onClick={() => {
            setSearchOpen(false);
            window.dispatchEvent(new Event("sur-home-feed"));
          }}
        >
          <img src="/brand/logo-wordmark.png" alt="" className="h-8 w-auto sm:h-9" />
        </Link>

        <HeaderSearch />

        <nav className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2" aria-label={t("brand")}>
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label={home("search")}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search className="size-4" aria-hidden />
          </button>
          <Link
            href="/how"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("how")}
            title={t("how")}
          >
            <CircleHelp className="size-4" aria-hidden />
            <span className="hidden xl:inline">{t("how")}</span>
          </Link>
          <Link
            href="/editor"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("editor")}
          >
            <Scissors className="size-4" aria-hidden />
            <span className="hidden lg:inline">{t("editor")}</span>
          </Link>
          <LanguageToggle />
          <HeaderAuthPill />
        </nav>
      </div>
      {searchOpen ? (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <HeaderSearch
            className="block"
            autoFocus
            onSubmitted={() => setSearchOpen(false)}
          />
        </div>
      ) : null}
    </header>
  );
}
