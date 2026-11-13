"use client";

import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatClock, localizeDigits } from "@/lib/format";

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const t = useTranslations("Watch");
  const locale = useLocale();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  const pct = duration > 0 ? Math.min(100, Math.round((time / duration) * 100)) : 35;

  return (
    <div className="rounded-lg border border-border bg-secondary p-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={toggle}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
          aria-label={playing ? t("pause") : t("play")}
        >
          {playing ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e4d9c8]">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            className="mt-1.5 w-full accent-primary"
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(time, duration || 0)}
            aria-label={t("scrub")}
            onChange={(event) => {
              const next = Number(event.target.value);
              const audio = audioRef.current;
              if (audio) audio.currentTime = next;
              setTime(next);
            }}
          />
          <p className="mt-0.5 text-xs text-muted-foreground">
            {localizeDigits(formatClock(time), locale)} /{" "}
            {localizeDigits(formatClock(duration), locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
