"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { mutateCommunity, useCurrentUser } from "@/lib/community-store";
import { firebaseConfig, firebaseVapidKey } from "@/lib/firebase-public";

let listening = false;

async function savePushToken() {
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const { getApp, getApps, initializeApp } = await import("firebase/app");
  const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  if (!listening) {
    listening = true;
    onMessage(messaging, (payload) => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      const title = payload.notification?.title || payload.data?.title || "SurShongi";
      const body = payload.notification?.body || payload.data?.body || "";
      new Notification(title, { body, icon: "/icons/icon-192.png" });
    });
  }
  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("missing token");
  if (localStorage.getItem("sur-push-token") === token) return;
  const saved = await mutateCommunity<{ error?: string }>({ action: "savePushToken", token });
  if (saved.error) throw new Error(saved.error);
  localStorage.setItem("sur-push-token", token);
}

export function MessageAlerts({ className = "" }: { className?: string }) {
  const t = useTranslations("Pwa");
  const user = useCurrentUser();
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!user?.id || permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    void savePushToken().then(() => setFailed(false)).catch(() => setFailed(true));
  }, [user?.id, permission]);

  if (!user || (permission !== "default" && permission !== "denied" && !failed)) return null;

  return (
    <div className={`border-b border-[#D6EBFF] bg-[#E7F3FF] px-4 py-2.5 ${className}`}>
      <div className="mx-auto flex max-w-6xl items-center gap-3">
      <p className="min-w-0 flex-1 text-sm text-[#222325]">
        {permission === "denied" ? t("notifyBlocked") : failed ? t("notifyFailed") : t("notify")}
      </p>
      {permission === "denied" ? null : (
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
          className="h-9 shrink-0 rounded-full bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {t("notifyOn")}
        </button>
      )}
      </div>
    </div>
  );
}
