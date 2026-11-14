"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { mutateCommunity, useCurrentUser } from "@/lib/community-store";
import { firebaseConfig, firebaseVapidKey } from "@/lib/firebase-public";

function installedApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function savePushToken() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const { getApp, getApps, initializeApp } = await import("firebase/app");
  const { getMessaging, getToken } = await import("firebase/messaging");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const token = await getToken(getMessaging(app), {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return;
  if (localStorage.getItem("sur-push-token") === token) return;
  const saved = await mutateCommunity<{ error?: string }>({ action: "savePushToken", token });
  if (!saved.error) localStorage.setItem("sur-push-token", token);
}

export function MessageAlerts({ className = "" }: { className?: string }) {
  const t = useTranslations("Pwa");
  const user = useCurrentUser();
  const [standalone, setStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStandalone(installedApp());
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!standalone || !user?.id || permission !== "granted") return;
    if (!("serviceWorker" in navigator)) return;
    void savePushToken().catch(() => {});
  }, [standalone, user?.id, permission]);

  if (!standalone || !user || permission !== "default") return null;

  return (
    <div
      className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl border border-[#e4e5e7] bg-white p-2.5 shadow-xl sm:gap-3 sm:p-3 ${className}`}
    >
      <p className="min-w-0 flex-1 text-sm text-[#222325]">{t("notify")}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (!("Notification" in window)) return;
          setBusy(true);
          void Notification.requestPermission()
            .then((result) => {
              setPermission(result);
              if (result === "granted") return savePushToken();
            })
            .finally(() => setBusy(false));
        }}
        className="h-9 shrink-0 rounded-full bg-[#1dbf73] px-3 text-xs font-semibold text-white disabled:opacity-60"
      >
        {t("notifyOn")}
      </button>
    </div>
  );
}
