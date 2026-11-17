"use client";

import { useTranslations } from "next-intl";
import { rankedCovers } from "@/components/profile/default-cover-art";

export function CoverPicker({
  genres,
  instruments = [],
  role,
  selected,
  disabled,
  onSelect,
}: {
  genres: string[];
  instruments?: string[];
  role?: string;
  selected?: string;
  disabled?: boolean;
  onSelect: (src: string) => void;
}) {
  const t = useTranslations("Cover");
  const ranked = rankedCovers([...genres, ...instruments], role);

  return (
    <div>
      <p className="text-sm font-semibold text-[#222325]">{t("pick")}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("hint")}</p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ranked.map(({ cover, score }) => {
          const active = selected === cover.src;
          return (
            <li key={cover.id}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onSelect(cover.src)}
                className={
                  active
                    ? "block w-full overflow-hidden rounded-lg border-2 border-[#0D8BFF] text-left"
                    : "block w-full overflow-hidden rounded-lg border-2 border-transparent text-left hover:border-[#222325]"
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.src} alt="" className="h-16 w-full object-cover sm:h-20" />
                <span className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span className="truncate text-xs font-semibold text-[#222325]">
                    {t(cover.id)}
                  </span>
                  {score > 0 ? (
                    <span className="shrink-0 rounded-full bg-[#E7F3FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#0D8BFF]">
                      {t("forYou")}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
