"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  const t = useTranslations("Pwa");
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#e4e5e7] bg-white p-3 shadow-xl">
      <p className="min-w-0 flex-1 text-sm text-[#222325]">{t("install")}</p>
      <button
        type="button"
        onClick={() => setPrompt(null)}
        className="h-9 rounded-full px-3 text-xs font-semibold text-muted-foreground"
      >
        {t("later")}
      </button>
      <button
        type="button"
        onClick={() => {
          void prompt.prompt().then(() => setPrompt(null));
        }}
        className="h-9 rounded-full bg-[#1dbf73] px-3 text-xs font-semibold text-white"
      >
        {t("add")}
      </button>
    </div>
  );
}
