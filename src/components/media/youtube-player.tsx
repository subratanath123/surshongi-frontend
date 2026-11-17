"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { usePathname } from "@/i18n/navigation";

type YoutubePlayerProps = {
  videoId: string;
  title: string;
  flush?: boolean;
};

const stopEvent = "sur-youtube-stop";

let nextTicket = 0;
const listeners = new Set<(ticket: number) => void>();

function publishPlayback(ticket: number) {
  listeners.forEach((listener) => listener(ticket));
}

/** Stop every YouTube (and any page audio) when the route changes. */
export function YoutubeRouteStop() {
  const pathname = usePathname();

  useEffect(() => {
    window.dispatchEvent(new Event(stopEvent));
    document.querySelectorAll("iframe[src*='youtube']").forEach((node) => {
      const frame = node as HTMLIFrameElement;
      frame.contentWindow?.postMessage('{"event":"command","func":"stopVideo","args":""}', "*");
      frame.src = "about:blank";
    });
    document.querySelectorAll("audio, video").forEach((node) => {
      (node as HTMLMediaElement).pause();
    });
  }, [pathname]);

  return null;
}

export function YoutubePlayer({ videoId, title, flush = false }: YoutubePlayerProps) {
  const pathname = usePathname();
  const [ticket, setTicket] = useState<number | null>(null);
  const [startedOn, setStartedOn] = useState(pathname);
  const mine = useRef(0);

  useEffect(() => {
    const onClaim = (active: number) => {
      if (active !== mine.current) setTicket(null);
    };
    const onStop = () => {
      mine.current = 0;
      setTicket(null);
    };
    listeners.add(onClaim);
    window.addEventListener(stopEvent, onStop);
    return () => {
      listeners.delete(onClaim);
      window.removeEventListener(stopEvent, onStop);
    };
  }, []);

  const playing = ticket !== null && startedOn === pathname;

  if (playing) {
    return (
      <iframe
        className={flush ? "aspect-video w-full bg-black" : "aspect-video w-full rounded-lg bg-black"}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        const next = ++nextTicket;
        mine.current = next;
        publishPlayback(next);
        setStartedOn(pathname);
        setTicket(next);
      }}
      className={
        flush
          ? "relative block aspect-video w-full overflow-hidden bg-black"
          : "relative block aspect-video w-full overflow-hidden rounded-lg border border-border bg-white"
      }
    >
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 960px"
        className="object-cover scale-125"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-14 place-items-center rounded-full bg-white/95 text-[#222325] shadow-md">
          <Play className="size-6 translate-x-0.5 fill-current" aria-hidden />
        </span>
      </span>
      <span className="sr-only">{title}</span>
    </button>
  );
}
