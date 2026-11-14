"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import type { Musician } from "@/data/catalog";
import { mutateCommunity } from "@/lib/community-store";

const FIELDS = [
  { key: "twitterUrl", label: "linkTwitter", hosts: ["twitter.com", "x.com"] },
  { key: "facebookUrl", label: "linkFacebook", hosts: ["facebook.com", "fb.com"] },
  { key: "spotifyUrl", label: "linkSpotify", hosts: ["spotify.com"] },
  { key: "youtubeChannelUrl", label: "linkYoutube", hosts: ["youtube.com", "youtu.be"] },
] as const;

type LinkKey = (typeof FIELDS)[number]["key"];

export function ProfileLinks({ profile, isOwner }: { profile: Musician; isOwner: boolean }) {
  const t = useTranslations("Profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Record<LinkKey, string>>({
    twitterUrl: "",
    facebookUrl: "",
    spotifyUrl: "",
    youtubeChannelUrl: "",
  });

  const saved = FIELDS.map((field) => ({ ...field, href: profile[field.key] })).filter((field) => field.href);

  function startEdit() {
    setDraft({
      twitterUrl: profile.twitterUrl ?? "",
      facebookUrl: profile.facebookUrl ?? "",
      spotifyUrl: profile.spotifyUrl ?? "",
      youtubeChannelUrl: profile.youtubeChannelUrl ?? "",
    });
    setError("");
    setEditing(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    for (const field of FIELDS) {
      const value = draft[field.key].trim();
      if (value && !matchesHost(value, field.hosts)) {
        setError(t("linkInvalid"));
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const result = await mutateCommunity<{ db?: unknown; error?: string }>({
        action: "updateSocialLinks",
        twitterUrl: draft.twitterUrl.trim(),
        facebookUrl: draft.facebookUrl.trim(),
        spotifyUrl: draft.spotifyUrl.trim(),
        youtubeChannelUrl: draft.youtubeChannelUrl.trim(),
      });
      if (!result.db) {
        setError(result.error || t("linkInvalid"));
        return;
      }
      setEditing(false);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("linkInvalid"));
    } finally {
      setSaving(false);
    }
  }

  if (!isOwner && saved.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold text-[#222325]">{t("linksTitle")}</p>
        {isOwner && !editing ? (
          <button type="button" onClick={startEdit} className="text-xs font-semibold text-[#1dbf73] underline">
            {t("linksEdit")}
          </button>
        ) : null}
      </div>
      {editing ? (
        <form onSubmit={(event) => void save(event)} className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">{t("linksHint")}</p>
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[#222325]">{t(field.label)}</span>
              <input
                value={draft[field.key]}
                onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                placeholder="https://"
                inputMode="url"
                className="h-9 w-full max-w-md rounded-full border border-[#e4e5e7] bg-white px-3 text-xs text-foreground outline-none"
              />
            </label>
          ))}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {t("linksCancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-8 rounded-full bg-[#1dbf73] px-4 text-xs font-semibold text-white disabled:opacity-60"
            >
              {saving ? "…" : t("linksSave")}
            </button>
          </div>
        </form>
      ) : saved.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {saved.map((field) => (
            <a
              key={field.key}
              href={field.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center rounded-full border border-[#e4e5e7] bg-white px-3 text-xs font-semibold text-[#222325] hover:border-[#1dbf73]"
            >
              {t(field.label)}
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{t("linksEmpty")}</p>
      )}
    </div>
  );
}

function matchesHost(value: string, hosts: readonly string[]) {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const host = new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
    return hosts.some((item) => host === item || host.endsWith(`.${item}`));
  } catch {
    return false;
  }
}
