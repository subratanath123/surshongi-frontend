"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function HeaderSearch() {
  const t = useTranslations("Home");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = query.trim();
    router.push(clean ? `/find?q=${encodeURIComponent(clean)}` : "/find");
  }

  return (
    <form onSubmit={submit} className="hidden min-w-0 flex-1 md:block">
      <label className="relative mx-auto block w-full max-w-xl">
        <span className="sr-only">{t("search")}</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          className="h-10 w-full rounded-lg border border-border bg-white pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
        />
      </label>
    </form>
  );
}
