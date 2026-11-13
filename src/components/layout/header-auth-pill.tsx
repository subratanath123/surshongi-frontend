"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pick } from "@/data/catalog";
import { Link } from "@/i18n/navigation";
import { setSessionUser, useCurrentUser } from "@/lib/community-store";

export function HeaderAuthPill() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const user = useCurrentUser();
  const [leaving, setLeaving] = useState(false);

  if (user) {
    const name = pick(locale, user.nameBn, user.name);
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href={`/u/${user.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-2.5 text-xs font-semibold text-foreground hover:border-[#1dbf73]"
        >
          <span className="grid size-6 place-items-center rounded-full bg-[#222325] text-[11px] font-bold text-white">
            {name.slice(0, 1)}
          </span>
          <span className="hidden max-w-24 truncate sm:inline sm:max-w-32">{name}</span>
        </Link>
        <Link
          href="/orders"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-[#222325] hover:border-[#1dbf73]"
        >
          {t("orders")}
        </Link>
        <Link
          href="/register"
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-[#222325] hover:border-[#1dbf73]"
        >
          {t("editProfile")}
        </Link>
        <button
          type="button"
          disabled={leaving}
          onClick={() => {
            setLeaving(true);
            void setSessionUser(null).finally(() => setLeaving(false));
          }}
          className="inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-60"
        >
          {leaving ? "…" : t("logout")}
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/register"
      className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:brightness-95"
    >
      {t("register")}
    </Link>
  );
}
