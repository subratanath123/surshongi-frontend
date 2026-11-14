"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { apiUrl } from "@/lib/api-base";

export function ActivityTracker() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    void fetch(apiUrl("/community-activity"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ path: pathname }),
      cache: "no-store",
    }).catch(() => {});
  }, [pathname]);

  return null;
}
