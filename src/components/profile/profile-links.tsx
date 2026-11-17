"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Musician } from "@/data/catalog";
import { mutateCommunity } from "@/lib/community-store";

const FIELDS = [
  {
    key: "youtubeChannelUrl",
    label: "linkYoutube",
    hint: "linkYoutubeHint",
    placeholder: "https://youtube.com/@yourchannel",
    hosts: ["youtube.com", "youtu.be", "music.youtube.com"],
    className: "border-transparent bg-[#222325] text-white hover:bg-[#111]",
  },
  {
    key: "spotifyUrl",
    label: "linkSpotify",
    hint: "linkSpotifyHint",
    placeholder: "https://open.spotify.com/artist/…",
    hosts: ["spotify.com"],
    className: "border-[#5B35F5] bg-white text-[#222325] hover:bg-[#F3EEFF]",
  },
  {
    key: "facebookUrl",
    label: "linkFacebook",
    hint: "linkFacebookHint",
    placeholder: "https://facebook.com/yourpage",
    hosts: ["facebook.com", "fb.com"],
    className: "border-[#e4e5e7] bg-white text-[#222325] hover:border-[#5B35F5]",
  },
  {
    key: "twitterUrl",
    label: "linkTwitter",
    hint: "linkTwitterHint",
    placeholder: "https://x.com/yourname",
    hosts: ["twitter.com", "x.com"],
    className: "border-[#e4e5e7] bg-white text-[#222325] hover:border-[#5B35F5]",
  },
] as const;

type LinkKey = (typeof FIELDS)[number]["key"];

export function ProfileLinks({ profile, isOwner }: { profile: Musician; isOwner: boolean }) {
  const t = useTranslations("Profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [draft, setDraft] = useState<Record<LinkKey, string>>(() => draftFrom(profile));

  const twitterUrl = profile.twitterUrl ?? "";
  const facebookUrl = profile.facebookUrl ?? "";
  const spotifyUrl = profile.spotifyUrl ?? "";
  const youtubeChannelUrl = profile.youtubeChannelUrl ?? "";
  useEffect(() => {
    setDraft({ twitterUrl, facebookUrl, spotifyUrl, youtubeChannelUrl });
  }, [twitterUrl, facebookUrl, spotifyUrl, youtubeChannelUrl]);

  const saved = FIELDS.map((field) => ({ ...field, href: profile[field.key] })).filter((field) => field.href);

  async function save(event: FormEvent) {
    event.preventDefault();
    for (const field of FIELDS) {
      const value = draft[field.key].trim();
      if (value && !matchesHost(value, field.hosts)) {
        setError(t("linkInvalid"));
        setSavedNote(false);
        return;
      }
    }
    setSaving(true);
    setError("");
    setSavedNote(false);
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
      setSavedNote(true);
      setEditing(false);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("linkInvalid"));
    } finally {
      setSaving(false);
    }
  }

  if (!isOwner && saved.length === 0) return null;

  if (!editing) {
    return (
      <div className="mt-4">
        {saved.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {saved.map((field) => (
              <a
                key={field.key}
                href={field.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold ${field.className}`}
              >
                {t(field.label)}
              </a>
            ))}
            {isOwner ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setEditing(true);
                }}
                className="inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold text-[#5B35F5] hover:bg-[#F3EEFF]"
              >
                {t("linksEdit")}
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-10 items-center rounded-full border border-dashed border-[#5B35F5] px-4 text-sm font-semibold text-[#5B35F5] hover:bg-[#F3EEFF]"
          >
            {t("linksTitle")}
          </button>
        )}
        {savedNote ? <p className="mt-2 text-xs font-medium text-[#5B35F5]">{t("linksSaved")}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void save(event)} className="mt-4 w-full max-w-lg rounded-xl border border-[#e4e5e7] bg-white p-4">
      <p className="text-sm font-semibold text-[#222325]">{t("linksTitle")}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("linksHint")}</p>
      <div className="mt-3 space-y-3">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="block text-xs font-semibold text-[#222325]">{t(field.label)}</span>
            <span className="mb-1 block text-[11px] text-muted-foreground">{t(field.hint)}</span>
            <input
              value={draft[field.key]}
              onChange={(event) => {
                setSavedNote(false);
                setDraft((current) => ({ ...current, [field.key]: event.target.value }));
              }}
              placeholder={field.placeholder}
              inputMode="url"
              className="h-9 w-full rounded-full border border-[#e4e5e7] bg-white px-3 text-xs text-foreground outline-none"
            />
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="h-8 rounded-full bg-[#5B35F5] px-4 text-xs font-semibold text-white disabled:opacity-60"
        >
          {saving ? "…" : t("linksSave")}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(draftFrom(profile));
            setError("");
            setEditing(false);
          }}
          className="h-8 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          {t("linksCancel")}
        </button>
      </div>
    </form>
  );
}

function draftFrom(profile: Musician): Record<LinkKey, string> {
  return {
    twitterUrl: profile.twitterUrl ?? "",
    facebookUrl: profile.facebookUrl ?? "",
    spotifyUrl: profile.spotifyUrl ?? "",
    youtubeChannelUrl: profile.youtubeChannelUrl ?? "",
  };
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
