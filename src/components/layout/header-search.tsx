"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function HeaderSearch({
  className = "hidden min-w-0 flex-1 md:block",
  autoFocus = false,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const t = useTranslations("Home");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    router.push(clean ? { pathname: "/", query: { q: clean } } : "/");
    onSubmitted?.();
  }

  return (
    <form onSubmit={submit} className={className}>
      <label className="relative mx-auto flex w-full max-w-xl items-center">
        <span className="sr-only">{t("search")}</span>
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          className="h-10 w-full rounded-lg border border-border bg-white pr-24 pl-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          className="absolute top-1 right-1 inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:brightness-95"
        >
          <Search className="size-3.5" aria-hidden />
          {t("ask")}
        </button>
      </label>
    </form>
  );
}
