"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  src,
  name,
  className,
  textClassName = "text-lg",
}: {
  src?: string;
  name: string;
  className?: string;
  textClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && failedSrc !== src);

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src ?? null)}
        className={cn(
          "shrink-0 rounded-full border-2 border-white bg-muted object-cover shadow-sm",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-white bg-[#161311] font-bold text-[#f7f1e6] shadow-sm",
        textClassName,
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}
