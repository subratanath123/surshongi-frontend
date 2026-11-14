"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallApi = {
  prompt: InstallPrompt | null;
  dismiss: () => void;
  accept: () => void;
};

const InstallContext = createContext<InstallApi>({
  prompt: null,
  dismiss: () => {},
  accept: () => {},
});

export function PwaRegister({ children }: { children: React.ReactNode }) {
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

  const api: InstallApi = {
    prompt,
    dismiss: () => setPrompt(null),
    accept: () => {
      void prompt?.prompt().then(() => setPrompt(null));
    },
  };

  return <InstallContext.Provider value={api}>{children}</InstallContext.Provider>;
}

export function InstallBanner({ className = "" }: { className?: string }) {
  const t = useTranslations("Pwa");
  const { prompt, dismiss, accept } = useContext(InstallContext);
  if (!prompt) return null;

  return (
    <div
      className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl border border-[#e4e5e7] bg-white p-2.5 shadow-xl sm:gap-3 sm:p-3 ${className}`}
    >
      <p className="min-w-0 flex-1 truncate text-sm text-[#222325]">{t("install")}</p>
      <button
        type="button"
        onClick={dismiss}
        className="h-9 shrink-0 rounded-full px-3 text-xs font-semibold text-muted-foreground"
      >
        {t("later")}
      </button>
      <button
        type="button"
        onClick={accept}
        className="h-9 shrink-0 rounded-full bg-[#1dbf73] px-3 text-xs font-semibold text-white"
      >
        {t("add")}
      </button>
    </div>
  );
}
