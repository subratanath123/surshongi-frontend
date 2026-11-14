"use client";

import { useEffect } from "react";

/** Keep bottom controls above the mobile browser bar, which covers position:fixed until scroll. */
export function DockInset() {
  useEffect(() => {
    const root = document.documentElement;
    let last = "";
    const sync = () => {
      const viewport = window.visualViewport;
      const bottom = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;
      const right = viewport
        ? Math.max(0, window.innerWidth - viewport.width - viewport.offsetLeft)
        : 0;
      const width = viewport ? viewport.width : window.innerWidth;
      const left = viewport ? viewport.offsetLeft : 0;
      const next = `${Math.round(bottom)}:${Math.round(right)}:${Math.round(width)}:${Math.round(left)}`;
      if (next === last) return;
      last = next;
      root.style.setProperty("--dock-bottom", `${Math.round(bottom)}px`);
      root.style.setProperty("--dock-right", `${Math.round(right)}px`);
      root.style.setProperty("--vv-width", `${Math.round(width)}px`);
      root.style.setProperty("--vv-left", `${Math.round(left)}px`);
    };
    sync();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync);
    // Phone browser bars change the visible area without a reliable resize event.
    const timer = window.setInterval(sync, 200);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      window.clearInterval(timer);
      root.style.removeProperty("--dock-bottom");
      root.style.removeProperty("--dock-right");
      root.style.removeProperty("--vv-width");
      root.style.removeProperty("--vv-left");
    };
  }, []);

  return null;
}
