"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

export function HeaderSearch({
  className = "min-w-0 flex-1",
  autoFocus = false,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const t = useTranslations("Home");
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    router.push(clean ? { pathname: "/", query: { q: clean } } : "/");
    onSubmitted?.();
  }

  return (
    <form onSubmit={submit} className={className}>
      <label className="relative flex w-full items-center">
        <span className="sr-only">{t("search")}</span>
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          className="h-12 w-full rounded-lg border border-border bg-white pr-28 pl-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
        />
        <button
          type="submit"
          className="absolute top-1.5 right-1.5 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:brightness-95"
        >
          <Search className="size-4" aria-hidden />
          {t("ask")}
        </button>
      </label>
    </form>
  );
}
