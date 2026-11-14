import { useTranslations } from "next-intl";
import { Mark } from "@/components/brand/mark";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");

  return (
    <footer className="mt-10 bg-[#222325] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="max-w-md">
          <Link href="/" className="inline-flex items-center gap-2">
            <Mark className="text-primary" />
            <span className="text-base font-semibold">{nav("brand")}</span>
          </Link>
          <p className="mt-3 text-sm leading-6 text-white/70">{t("blurb")}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm sm:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label={nav("brand")}>
            <Link href="/how" className="text-white/70 hover:text-white">
              {nav("how")}
            </Link>
            <Link href="/register" className="text-white/70 hover:text-white">
              {nav("register")}
            </Link>
            <Link href="/find" className="text-white/70 hover:text-white">
              {nav("find")}
            </Link>
            <Link href="/editor" className="text-white/70 hover:text-white">
              {nav("editor")}
            </Link>
          </nav>
          <p className="text-white/70">{t("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
