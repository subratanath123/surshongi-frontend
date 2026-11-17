"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiUrl } from "@/lib/api-base";

type ActivityEvent = {
  id: string;
  name: string;
  email: string;
  action: "page" | "login" | "logout" | string;
  path: string;
  createdAt: string;
};

export function ActivityScreen() {
  const t = useTranslations("Activity");
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(apiUrl("/community-activity"), { cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      setDenied(true);
      setEvents([]);
      return;
    }
    const data = (await res.json()) as { events?: ActivityEvent[] };
    setDenied(false);
    setEvents(Array.isArray(data.events) ? data.events : []);
  }, []);

  useEffect(() => {
    void load().catch(() => setDenied(true));
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#222325]">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("lead")}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="h-10 rounded-full bg-[#5B35F5] px-4 text-sm font-semibold text-white"
        >
          {t("refresh")}
        </button>
      </div>

      {denied ? (
        <p className="mt-6 rounded-lg border border-border bg-white p-6 text-sm text-[#222325]">{t("denied")}</p>
      ) : events === null ? (
        <p className="mt-6 text-sm text-muted-foreground">…</p>
      ) : events.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {events.map((event) => (
            <li key={event.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr_8rem_1fr] sm:items-center sm:gap-3">
              <time className="text-xs text-muted-foreground" dateTime={event.createdAt}>
                {formatWhen(event.createdAt)}
              </time>
              <p className="min-w-0 truncate text-sm font-semibold text-[#222325]">
                {event.name || t("guest")}
                {event.email ? <span className="ml-2 font-normal text-muted-foreground">{event.email}</span> : null}
              </p>
              <p className="text-sm text-[#222325]">{label(t, event.action)}</p>
              <p className="min-w-0 truncate text-sm text-muted-foreground">{event.path || "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function label(t: (key: "page" | "login" | "logout") => string, action: string) {
  if (action === "login" || action === "logout" || action === "page") return t(action);
  return action;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Dhaka",
  }).format(date);
}
