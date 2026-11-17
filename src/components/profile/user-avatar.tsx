"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedMark({ className, label }: { className?: string; label: string }) {
  return (
    <BadgeCheck
      className={cn("shrink-0 fill-[#0D8BFF] text-white", className)}
      aria-label={label}
      role="img"
    />
  );
}

export function UserAvatar({
  src,
  name,
  className,
  textClassName = "text-lg",
  verified = false,
  verifiedLabel = "Selfie verified",
}: {
  src?: string;
  name: string;
  className?: string;
  textClassName?: string;
  verified?: boolean;
  verifiedLabel?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && failedSrc !== src);

  return (
    <span
      className={cn(
        "relative inline-grid size-10 shrink-0 place-items-center rounded-full border-2 border-white bg-muted shadow-sm",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src ?? null)}
          className="size-full rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "grid size-full place-items-center rounded-full bg-[#161311] font-bold text-[#f7f1e6]",
            textClassName,
          )}
        >
          {name.slice(0, 1)}
        </span>
      )}
      {verified ? (
        <VerifiedMark
          label={verifiedLabel}
          className="absolute -right-0.5 -bottom-0.5 size-5 rounded-full bg-white"
        />
      ) : null}
    </span>
  );
}
