"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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

export function MessageAlerts() {
  const t = useTranslations("Pwa");
  const router = useRouter();
  const user = useCurrentUser();
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const on = permission === "granted" && !failed;

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!user?.id || permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    void savePushToken().then(() => setFailed(false)).catch(() => setFailed(true));
  }, [user?.id, permission]);

  function enable() {
    if (!("Notification" in window)) return;
    setBusy(true);
    void Notification.requestPermission()
      .then((result) => {
        setPermission(result);
        if (result === "granted") return savePushToken().then(() => setFailed(false));
      })
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("notify")}
        aria-expanded={open}
        disabled={busy}
        onClick={() => {
          if (!user) {
            router.push("/register");
            return;
          }
          if (permission === "default") {
            setOpen(true);
            enable();
            return;
          }
          setOpen((value) => !value);
        }}
        className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-[#0B184D] hover:border-[#0D8BFF] disabled:opacity-60"
      >
        <Bell className={`size-5 ${on ? "fill-[#0D8BFF] text-[#0D8BFF]" : ""}`} aria-hidden />
        {on ? null : <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FF2D7A]" aria-hidden />}
      </button>
      {open && user ? (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-white p-3 shadow-xl">
          <p className="text-sm text-[#0B184D]">
            {permission === "denied" ? t("notifyBlocked") : failed ? t("notifyFailed") : on ? t("notifyReady") : t("notify")}
          </p>
          {permission === "denied" || on ? null : (
            <button
              type="button"
              disabled={busy}
              onClick={enable}
              className="mt-3 h-9 rounded-full bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60"
            >
              {t("notifyOn")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
