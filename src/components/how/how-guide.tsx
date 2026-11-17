"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Clapperboard,
  MessageCircle,
  Music,
  Scissors,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  SquarePen,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrentUser } from "@/lib/community-store";

const options = [
  { key: "ask", href: "/find", icon: Search },
  { key: "hire", href: "/#hire", icon: Clapperboard },
  { key: "agency", href: "/register?as=agency", icon: Building2 },
  { key: "musician", href: "/register?as=musician", icon: Music },
  { key: "member", href: "/register?as=member", icon: UserRound },
  { key: "prefs", href: "/#feed-prefs", icon: SlidersHorizontal },
  { key: "follow", href: "/#directory", icon: Users },
  { key: "post", href: "/#composer", icon: SquarePen },
  { key: "messages", href: "/#messages", icon: MessageCircle },
  { key: "orders", href: "/orders", icon: ShoppingBag },
  { key: "editor", href: "/editor", icon: Scissors },
] as const;

export function HowGuide() {
  const t = useTranslations("Guide");
  const user = useCurrentUser();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const profileHref = ready && user ? `/u/${user.id}` : "/register";

  const cards = [
    ...options.map((option) => ({ ...option, href: option.href })),
    { key: "profile" as const, href: profileHref, icon: UserPlus },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
      <h1 className="font-display text-3xl text-[#222325] sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("sub")}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.key}>
              <Link
                href={card.href}
                className="group flex h-full gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-[#0D8BFF]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#0D8BFF]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-base font-semibold text-[#222325] group-hover:text-[#0D8BFF]">
                      {t(`${card.key}.title`)}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#0D8BFF]">{t("open")}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {t(`${card.key}.body`)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
