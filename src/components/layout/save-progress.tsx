"use client";

import { useSaveBusy } from "@/lib/community-store";

/** Thin bar at the top of the screen while a follow or preference save is still in flight. */
export function SaveProgress() {
  const busy = useSaveBusy();
  if (!busy) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden bg-[#F3EEFF]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Saving"
    >
      <div className="save-progress-bar h-full w-1/3 rounded-full bg-primary" />
    </div>
  );
}
