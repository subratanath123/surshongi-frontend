import { Scissors, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Mark } from "@/components/brand/mark";
import { HeaderAuthPill } from "@/components/layout/header-auth-pill";
import { HeaderSearch } from "@/components/layout/header-search";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Link } from "@/i18n/navigation";

export function SiteHeader() {
  const t = useTranslations("Nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-5">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label={t("home")}>
          <Mark className="size-7 text-primary" />
          <span className="truncate text-lg font-bold tracking-tight text-foreground">
            {t("brand")}
          </span>
        </Link>

        <HeaderSearch />

        <nav className="ml-auto flex items-center gap-1.5 sm:gap-2" aria-label={t("brand")}>
          <Link
            href="/find"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
            aria-label={t("find")}
          >
            <Search className="size-4" aria-hidden />
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
    </header>
  );
}
