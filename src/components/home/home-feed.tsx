"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Globe,
  Heart,
  MessageCircle,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AudioPlayer } from "@/components/media/audio-player";
import { RichText, RichTextField } from "@/components/media/rich-text";
import { StarRating } from "@/components/media/star-rating";
import { YoutubePlayer } from "@/components/media/youtube-player";
import { DefaultCoverArt } from "@/components/profile/default-cover-art";
import { UserAvatar } from "@/components/profile/user-avatar";
import { SearchResultsList } from "@/components/search/search-results-list";
import { Button } from "@/components/ui/button";
import { pick, type Musician, type Role } from "@/data/catalog";
import { Link, useRouter } from "@/i18n/navigation";
import {
  mutateCommunity,
  openChatWindow,
  uploadAudioFile,
  useCommunityStore,
  useCurrentUser,
} from "@/lib/community-store";
import type { CommunityPost, DbUser, PostCategory } from "@/lib/db-types";
import { formatCount, formatNumber, formatRating } from "@/lib/format";
import { apiUrl } from "@/lib/api-base";
import { hireSkills } from "@/lib/hire-skills";
import type { SemanticMusicianHit } from "@/lib/search-types";
import { youtubeIdFromUrl } from "@/lib/youtube";

const filters = ["all", "following", "musicians", "vocal", "guitar", "percussion", "folk"] as const;
type Filter = (typeof filters)[number];

type ServiceId =
  | "vocalistHire"
  | "guitaristHire"
  | "tablaHire"
  | "drummerHire"
  | "fluteHire"
  | "harmoniumHire"
  | "violinHire"
  | "keyboardHire"
  | "bassHire"
  | "dholHire"
  | "producers"
  | "femaleSingers"
  | "maleSingers"
  | "mixing"
  | "songwriters"
  | "beatmakers"
  | "mastering"
  | "session";

type CategoryTile = {
  id: ServiceId;
  image: string;
  position: string;
  roles: Role[];
  terms: string[];
  useRole: boolean;
  group: "hire" | "studio";
  gender?: "female" | "male";
};

const categoryTiles: CategoryTile[] = [
  ...hireSkills
    .filter((skill) => skill.onHome)
    .map((skill) => ({
      id: skill.id,
      image: skill.image,
      position: skill.position,
      roles: skill.roles,
      terms: skill.terms,
      useRole: skill.useRole,
      group: "hire" as const,
    })),
  { id: "producers", image: "/covers/cover-producer.jpg", position: "center", roles: ["producer"], terms: [], useRole: true, group: "studio" },
  {
    id: "femaleSingers",
    image: "/covers/cover-female-singer.jpg",
    position: "center",
    roles: ["vocalist"],
    terms: hireSkills.find((skill) => skill.id === "vocalistHire")?.terms ?? [],
    useRole: true,
    group: "studio",
    gender: "female",
  },
  {
    id: "maleSingers",
    image: "/covers/cover-male-singer.jpg",
    position: "center",
    roles: ["vocalist"],
    terms: hireSkills.find((skill) => skill.id === "vocalistHire")?.terms ?? [],
    useRole: true,
    group: "studio",
    gender: "male",
  },
  {
    id: "mixing",
    image: "/covers/cover-mixing.jpg",
    position: "center",
    roles: ["producer"],
    terms: hireSkills.find((skill) => skill.id === "mixing")?.terms ?? [],
    useRole: true,
    group: "studio",
  },
  { id: "songwriters", image: "/covers/cover-songwriter.jpg", position: "center", roles: ["lyricist"], terms: [], useRole: true, group: "studio" },
  {
    id: "beatmakers",
    image: "/covers/cover-beats.jpg",
    position: "center",
    roles: ["producer"],
    terms: hireSkills.find((skill) => skill.id === "beatmakers")?.terms ?? [],
    useRole: true,
    group: "studio",
  },
  {
    id: "mastering",
    image: "/covers/cover-mastering.jpg",
    position: "center",
    roles: ["producer"],
    terms: hireSkills.find((skill) => skill.id === "mastering")?.terms ?? [],
    useRole: true,
    group: "studio",
  },
  {
    id: "session",
    image: "/covers/cover-session.jpg",
    position: "center",
    roles: ["guitarist", "percussion", "flute"],
    terms: [],
    useRole: true,
    group: "studio",
  },
];

function tileMatches(
  tile: CategoryTile,
  played: Role[],
  instruments: string[],
  extra = "",
  gender?: "female" | "male",
) {
  if (tile.gender && gender !== tile.gender) return false;
  const hay = `${instruments.join(" ")} ${extra}`.toLowerCase();
  const termHit = tile.terms.some((term) => hay.includes(term.toLowerCase()));
  const roleHit = tile.useRole && played.some((role) => tile.roles.includes(role));
  return termHit || roleHit;
}

function CategoryCard({
  tile,
  pressed,
  label,
  onPick,
}: {
  tile: CategoryTile;
  pressed: boolean;
  label: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPick}
      className={`relative aspect-[16/10] overflow-hidden rounded-xl ${
        pressed ? "ring-2 ring-[#1dbf73] ring-offset-2" : ""
      }`}
    >
      <img
        src={tile.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: tile.position }}
      />
      <span className="absolute inset-0 bg-black/40" />
      <span className="relative flex h-full items-center justify-center px-3 text-center text-sm font-bold text-white sm:text-base">
        {label}
      </span>
    </button>
  );
}

function CategoryBand({
  title,
  tiles,
  service,
  label,
  onPick,
}: {
  title: string;
  tiles: CategoryTile[];
  service: ServiceId | null;
  label: (id: ServiceId) => string;
  onPick: (id: ServiceId) => void;
}) {
  const t = useTranslations("Home");
  const [open, setOpen] = useState(false);
  const preview = tiles.slice(0, 4);
  const rest = tiles.slice(4);

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-[#222325]">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {preview.map((tile) => (
          <CategoryCard
            key={tile.id}
            tile={tile}
            pressed={service === tile.id}
            label={label(tile.id)}
            onPick={() => onPick(tile.id)}
          />
        ))}
      </div>
      {rest.length > 0 ? (
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-out ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
              {rest.map((tile) => (
                <CategoryCard
                  key={tile.id}
                  tile={tile}
                  pressed={service === tile.id}
                  label={label(tile.id)}
                  onPick={() => onPick(tile.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {rest.length > 0 ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="mt-3 w-full rounded-lg border border-border bg-white py-2 text-sm font-semibold text-[#222325] transition-colors hover:border-[#1dbf73] hover:text-[#1dbf73]"
        >
          {open ? t("seeLess") : t("seeMore")}
        </button>
      ) : null}
    </section>
  );
}

const roles: Role[] = ["vocalist", "guitarist", "percussion", "flute", "producer", "lyricist"];
const feedPreferenceIds = [...roles, "folk", "rabindra", "nazrul", "pop"] as const;

type FeedCard = {
  post: CommunityPost;
  author: DbUser;
  preferred: boolean;
};
const categories: PostCategory[] = ["offering", "collab", "work"];

function formatPostTime(iso: string, locale: string, hydrated: boolean) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (hydrated) {
    const diffMin = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
    if (diffMin < 1) return locale === "bn" ? "এইমাত্র" : "Just now";
    if (diffMin < 60) {
      return locale === "bn" ? `${formatNumber(diffMin, locale)} মিনিট আগে` : `${diffMin}m ago`;
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      return locale === "bn" ? `${formatNumber(diffHr, locale)} ঘণ্টা আগে` : `${diffHr}h ago`;
    }
  }
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function HomeFeed() {
  const t = useTranslations("Home");
  const locale = useLocale();
  const router = useRouter();
  const { db, hydrated } = useCommunityStore();
  const currentUser = useCurrentUser();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [service, setService] = useState<ServiceId | null>(null);
  const [searchingVector, setSearchingVector] = useState(false);
  const [vectorQuery, setVectorQuery] = useState("");
  const [vectorHits, setVectorHits] = useState<SemanticMusicianHit[] | null>(null);
  const searchSeq = useRef(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [postCategory, setPostCategory] = useState<PostCategory>("offering");
  const [postRole, setPostRole] = useState<Role>(currentUser?.roles[0] ?? "guitarist");
  const [postTitle, setPostTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [postPrice, setPostPrice] = useState("");
  const [postYoutube, setPostYoutube] = useState("");
  const [postAudio, setPostAudio] = useState("");
  const [uploading, setUploading] = useState(false);
  const [composerError, setComposerError] = useState("");
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedReload, setFeedReload] = useState(0);
  const feedCursor = useRef<string | null>(null);
  const feedLoadingRef = useRef(false);
  const feedSeq = useRef(0);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const activeUserId = currentUser?.id ?? null;
  const myFollows = useMemo(
    () => (activeUserId ? (db.follows[activeUserId] ?? []) : []),
    [db.follows, activeUserId],
  );

  const userMap = useMemo(() => {
    const map = new Map<string, DbUser>();
    for (const u of db.users) {
      map.set(u.id, u);
    }
    return map;
  }, [db.users]);

  const preferenceKey = (currentUser?.feedPreferences ?? []).join(",");

  async function loadFeed(reset: boolean) {
    if (feedLoadingRef.current) return;
    if (!reset && !feedCursor.current) return;
    const seq = reset ? ++feedSeq.current : feedSeq.current;
    feedLoadingRef.current = true;
    setFeedLoading(true);
    try {
      const params = new URLSearchParams({ filter, limit: "8" });
      if (!reset && feedCursor.current) params.set("cursor", feedCursor.current);
      const res = await fetch(apiUrl(`/api/feed?${params}`), { cache: "no-store" });
      const data = (await res.json()) as { posts?: FeedCard[]; next?: string };
      if (seq !== feedSeq.current || !res.ok) return;
      const page = Array.isArray(data.posts) ? data.posts : [];
      setFeedCards((current) => (reset ? page : [...current, ...page]));
      feedCursor.current = typeof data.next === "string" ? data.next : null;
      setFeedHasMore(Boolean(data.next));
    } catch {
      if (seq !== feedSeq.current) return;
      if (reset) setFeedCards([]);
      feedCursor.current = null;
      setFeedHasMore(false);
    } finally {
      if (seq === feedSeq.current) {
        feedLoadingRef.current = false;
        setFeedLoading(false);
      }
    }
  }

  const visibleMusicians = useMemo(() => {
    return db.users.filter((person) => {
      if (!person.profileCompleted) return false;
      if (person.isPrivate) return false;
      if (activeUserId && person.id === activeUserId) return false;
      if (filter === "following" && !myFollows.includes(person.id)) return false;
      if (filter === "vocal" && !person.roles.includes("vocalist")) return false;
      if (filter === "guitar" && !person.roles.includes("guitarist")) return false;
      if (filter === "percussion" && !person.roles.includes("percussion")) return false;
      if (filter === "folk" && !person.genreTerms.some((term) => term === "folk" || term === "লোক")) {
        return false;
      }
      if (service) {
        const tile = categoryTiles.find((item) => item.id === service);
        if (!tile) return false;
        const instruments = [...person.instruments, ...person.instrumentsBn];
        if (!tileMatches(tile, person.roles, instruments, "", person.gender)) return false;
      }
      return true;
    });
  }, [activeUserId, db.users, filter, myFollows, service]);

  const searchActive = searchingVector || vectorHits !== null;

  useEffect(() => {
    if (filter === "musicians" || searchActive) return;
    feedCursor.current = null;
    feedLoadingRef.current = false;
    void loadFeed(true);
    // Reload when the signed-in person's preferences or the feed filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, activeUserId, preferenceKey, searchActive, feedReload]);

  useEffect(() => {
    const node = feedEndRef.current;
    if (!node || !feedHasMore || filter === "musicians" || searchActive) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadFeed(false);
    }, { rootMargin: "480px" });
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedHasMore, filter, searchActive, feedCards.length]);
  const searchRef = useRef<HTMLFormElement>(null);
  const [askIn, setAskIn] = useState(false);

  const relatedPosts = useMemo(() => {
    const terms = vectorQuery
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length >= 2);
    if (!searchActive || terms.length === 0) return [];
    return db.posts.filter((post) => {
      const author = userMap.get(post.musicianId);
      const hay = [
        post.title,
        post.titleBn,
        post.text,
        post.textBn,
        post.roleTag,
        author?.name,
        author?.nameBn,
        ...(author?.instruments ?? []),
        ...(author?.instrumentsBn ?? []),
        ...(author?.roles ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return terms.some((term) => hay.includes(term));
    });
  }, [db.posts, searchActive, userMap, vectorQuery]);

  useEffect(() => {
    if (!searchActive) {
      setAskIn(false);
      return;
    }
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const frame = requestAnimationFrame(() => setAskIn(true));
    return () => cancelAnimationFrame(frame);
  }, [searchActive, vectorQuery]);

  function clearSearch() {
    searchSeq.current += 1;
    setQuery("");
    setVectorHits(null);
    setVectorQuery("");
    setSearchingVector(false);
  }

  const composerRef = useRef<HTMLDivElement>(null);

  function focusComposer(cat?: PostCategory) {
    if (cat) setPostCategory(cat);
    setService(null);
    setFilter("all");
    clearSearch();
    setComposerOpen(true);
  }

  useEffect(() => {
    if (!composerOpen) return;
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [composerOpen]);

  async function handleSemanticSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      clearSearch();
      return;
    }
    const seq = ++searchSeq.current;
    setSearchingVector(true);
    setVectorQuery(q);
    try {
      const res = await fetch(apiUrl(`/community-search?q=${encodeURIComponent(q)}`), {
        cache: "no-store",
      });
      const data = (await res.json()) as { hits?: SemanticMusicianHit[] };
      if (seq !== searchSeq.current) return;
      setVectorHits(Array.isArray(data.hits) ? data.hits : []);
    } catch {
      if (seq === searchSeq.current) setVectorHits([]);
    } finally {
      if (seq === searchSeq.current) setSearchingVector(false);
    }
  }

  async function handleCreatePost(event: FormEvent) {
    event.preventDefault();
    const authorId = currentUser?.id;
    if (!authorId) {
      router.push("/register");
      return;
    }
    if (!postTitle.trim() || !postText.trim()) {
      setComposerError(t("postRequired"));
      return;
    }
    const ytId = youtubeIdFromUrl(postYoutube);
    if (postYoutube.trim() && !ytId) {
      setComposerError(t("badYoutube"));
      return;
    }
    const priceNum = Number(postPrice.replace(/[^\d]/g, ""));
    setComposerError("");
    await mutateCommunity({
      action: "createPost",
      musicianId: authorId,
      category: postCategory,
      title: postTitle.trim(),
      text: postText.trim(),
      roleTag: postRole,
      priceBdt: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : undefined,
      youtubeId: ytId || undefined,
      audioSrc: postAudio.trim() || undefined,
    });
    setPostTitle("");
    setPostText("");
    setPostPrice("");
    setPostYoutube("");
    setPostAudio("");
    setComposerOpen(false);
    setFeedReload((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5">
      {/* Top Header */}
      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${
          searchActive ? "grid-rows-[0fr] -translate-y-2 opacity-0" : "grid-rows-[1fr] translate-y-0 opacity-100"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#222325] sm:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{t("lead")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={() => (composerOpen ? setComposerOpen(false) : focusComposer())}
              >
                <Plus className="size-4" />
                {t("createPostBtn")}
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/register">{currentUser ? t("editProfile") : t("register")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Search Bar */}
      <form
        ref={searchRef}
        className={`sticky top-16 z-30 mt-6 flex scroll-mt-20 origin-top items-center gap-2 rounded-md border bg-white p-2 transition-all duration-500 ease-out ${
          searchActive
            ? "scale-[1.03] border-[#1dbf73] shadow-[0_16px_40px_rgba(29,191,115,0.18)] ring-2 ring-[#1dbf73]/30"
            : "border-[#e4e5e7] shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.06)]"
        }`}
        onSubmit={(e) => void handleSemanticSearch(e)}
      >
        <label className="sr-only" htmlFor="home-search">
          {t("search")}
        </label>
        <Sparkles className="ml-3 size-4 shrink-0 text-primary" aria-hidden />
        <input
          id="home-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value.trim()) clearSearch();
          }}
          placeholder={t("search")}
          className="h-10 min-w-0 flex-1 rounded-full bg-transparent px-2 text-sm outline-none"
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={clearSearch}
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
        <Button type="submit" size="sm" disabled={searchingVector} className="rounded-full px-5">
          {searchingVector ? "…" : t("ask")}
        </Button>
      </form>

      <div
        className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${
          searchActive || composerOpen
            ? "pointer-events-none grid-rows-[0fr] -translate-y-3 scale-[0.98] opacity-0"
            : "grid-rows-[1fr] translate-y-0 scale-100 opacity-100"
        }`}
      >
        <div className="overflow-hidden">
          <CategoryBand
            title={t("hireHeading")}
            tiles={categoryTiles.filter((tile) => tile.group === "hire")}
            service={service}
            label={(id) => t(`services.${id}`)}
            onPick={(id) => {
              clearSearch();
              setService((current) => (current === id ? null : id));
              setFilter("musicians");
            }}
          />
          <CategoryBand
            title={t("studioHeading")}
            tiles={categoryTiles.filter((tile) => tile.group === "studio")}
            service={service}
            label={(id) => t(`services.${id}`)}
            onPick={(id) => {
              clearSearch();
              setService((current) => (current === id ? null : id));
              setFilter("musicians");
            }}
          />
        </div>
      </div>

      {searchActive ? (
        <div
          className={`mt-2 origin-top transition-all duration-500 ease-out ${
            askIn ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0"
          }`}
        >
          <SearchResultsList
            hits={vectorHits ?? []}
            query={vectorQuery}
            loading={searchingVector}
            onClear={clearSearch}
          />
          <section className="mt-6" aria-labelledby="related-posts-heading">
            <h2 id="related-posts-heading" className="font-display text-xl font-bold text-[#222325]">
              {t("relatedPosts")}
            </h2>
            {relatedPosts.length === 0 ? (
              <p className="mt-4 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                {searchingVector ? "…" : t("noRelatedPosts")}
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {relatedPosts.map((post) => {
                  const author = userMap.get(post.musicianId);
                  if (!author) return null;
                  const loved = activeUserId ? post.lovedBy.includes(activeUserId) : false;
                  return (
                    <li key={post.id}>
                      <PostCard
                        post={post}
                        author={author}
                        locale={locale}
                        hydrated={hydrated}
                        loved={loved}
                        following={myFollows.includes(author.id)}
                        activeUserId={activeUserId}
                        onRequireSignIn={() => router.push("/register")}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <>
          {/* Filter Pills */}
          <div
            className="mt-4 flex gap-1.5 overflow-x-auto rounded-lg border border-border bg-card p-1.5"
            role="group"
            aria-label={t("filters")}
          >
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => {
                  setService(null);
                  setFilter(item);
                }}
                className={
                  filter === item
                    ? "shrink-0 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                    : "shrink-0 rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              >
                {t(item)}
                {item === "following" ? ` (${myFollows.length})` : ""}
              </button>
            ))}
          </div>

          {filter === "musicians" ? (
            /* Full-width Musicians Directory Grid */
            <section className="mt-6" aria-labelledby="directory-heading">
              <div className="flex items-center justify-between gap-2">
                <h2 id="directory-heading" className="font-display text-xl font-bold">
                  {t("directoryTitle")}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(visibleMusicians.length, locale)} {t("musiciansCount")}
                </span>
              </div>

              {visibleMusicians.length === 0 ? (
                <p className="mt-4 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                  {t("empty")}
                </p>
              ) : (
                <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleMusicians.map((person) => (
                    <li key={person.id}>
                      <PersonCard
                        person={person}
                        locale={locale}
                        following={myFollows.includes(person.id)}
                        activeUserId={activeUserId}
                        onRequireSignIn={() => router.push("/register")}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            /* Facebook-style Two-Column Layout: Main Feed Column + Right Musicians Sidebar */
            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,680px)_1fr]">
              {/* Main News Feed Column */}
              <section aria-labelledby="feed-heading" className="min-w-0 space-y-4">
                <div className="sr-only">
                  <h2 id="feed-heading">
                    {filter === "following" ? t("followingFeedTitle") : t("feedTitle")}
                  </h2>
                </div>

                <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-[#222325]">{t("feedPrefsLabel")}</p>
                  {currentUser ? (
                    <>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {feedPreferenceIds.map((id) => {
                          const selected = (currentUser.feedPreferences ?? []).includes(id);
                          const label = id in { folk: 1, rabindra: 1, nazrul: 1, pop: 1 }
                            ? t(`prefs.${id as "folk" | "rabindra" | "nazrul" | "pop"}`)
                            : t(`roles.${id as Role}`);
                          return (
                            <button
                              key={id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                const current = currentUser.feedPreferences ?? [];
                                const next = selected
                                  ? current.filter((item) => item !== id)
                                  : [...current, id];
                                void mutateCommunity({ action: "updateFeedPreferences", preferences: next });
                              }}
                              className={
                                selected
                                  ? "h-8 rounded-full bg-[#1dbf73] px-3 text-xs font-semibold text-white"
                                  : "h-8 rounded-full border border-[#e4e5e7] bg-white px-3 text-xs font-semibold text-[#222325] hover:border-[#1dbf73]"
                              }
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{t("feedPrefsHint")}</p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <Link href="/register" className="font-semibold text-primary underline">
                        {t("feedPrefsSignIn")}
                      </Link>
                    </p>
                  )}
                </div>

                <div ref={composerRef} className="scroll-mt-24 rounded-xl border border-border bg-white p-4 shadow-sm">
                  {composerOpen ? (
                    <form onSubmit={(e) => void handleCreatePost(e)}>
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={currentUser?.avatarUrl}
                          name={currentUser?.name ?? "S"}
                          verified={currentUser?.selfieVerified}
                          className="size-10 shrink-0"
                          textClassName="text-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#222325]">{t("composerTitle")}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {currentUser ? currentUser.name : t("composerHint")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setComposerOpen(false)}
                          className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                          aria-label={t("cancel")}
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label={t("composerTitle")}>
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            aria-pressed={postCategory === cat}
                            onClick={() => setPostCategory(cat)}
                            className={
                              postCategory === cat
                                ? "rounded-lg bg-primary px-2 py-2 text-xs font-semibold text-white"
                                : "rounded-lg border border-border bg-white px-2 py-2 text-xs font-medium text-[#222325] hover:border-[#1dbf73]"
                            }
                          >
                            {t(`categories.${cat}`)}
                          </button>
                        ))}
                      </div>

                      <fieldset className="mt-4">
                        <legend className="text-xs font-semibold text-[#222325]">{t("fieldRole")}</legend>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {roles.map((r) => (
                            <button
                              key={r}
                              type="button"
                              aria-pressed={postRole === r}
                              onClick={() => setPostRole(r)}
                              className={
                                postRole === r
                                  ? "rounded-full bg-[#222325] px-3 py-1 text-xs font-semibold text-white"
                                  : "rounded-full border border-border bg-white px-3 py-1 text-xs text-[#404145] hover:border-[#222325]"
                              }
                            >
                              {t(`roles.${r}`)}
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <label className="mt-4 block">
                        <span className="text-xs font-semibold text-[#222325]">{t("fieldTitle")}</span>
                        <input
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          placeholder={t("postTitlePlaceholder")}
                          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-[#222325] outline-none placeholder:text-[#95979d] focus-visible:border-[#1dbf73] focus-visible:ring-2 focus-visible:ring-[#1dbf73]/30"
                        />
                      </label>

                      <div className="mt-3">
                        <span className="text-xs font-semibold text-[#222325]">{t("fieldBody")}</span>
                        <RichTextField
                          value={postText}
                          onChange={setPostText}
                          placeholder={t("postBodyPlaceholder")}
                          rows={5}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="text-xs font-semibold text-[#222325]">
                            {t("fieldPrice")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
                          </span>
                          <span className="mt-1.5 flex h-11 items-center rounded-lg border border-border bg-white focus-within:border-[#1dbf73] focus-within:ring-2 focus-within:ring-[#1dbf73]/30">
                            <span className="pl-3 text-sm text-muted-foreground">৳</span>
                            <input
                              value={postPrice}
                              onChange={(e) => setPostPrice(e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="3000"
                              inputMode="numeric"
                              className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                            />
                          </span>
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold text-[#222325]">
                            {t("fieldYoutube")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
                          </span>
                          <input
                            value={postYoutube}
                            onChange={(e) => setPostYoutube(e.target.value)}
                            placeholder="https://youtube.com/watch?v="
                            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none placeholder:text-[#95979d] focus-visible:border-[#1dbf73] focus-visible:ring-2 focus-visible:ring-[#1dbf73]/30"
                          />
                        </label>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-semibold text-[#222325]">
                          {t("fieldAudio")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-[#222325] hover:border-[#1dbf73]">
                            <Upload className="size-4 text-primary" />
                            {uploading ? t("uploading") : t("uploadAudio")}
                            <input
                              type="file"
                              accept="audio/*"
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploading(true);
                                try {
                                  const res = await uploadAudioFile(file);
                                  setPostAudio(res.url);
                                } finally {
                                  setUploading(false);
                                }
                              }}
                            />
                          </label>
                          {postAudio ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-3 text-xs text-[#222325]">
                              {t("audioAttached")}
                              <button
                                type="button"
                                onClick={() => setPostAudio("")}
                                className="grid size-5 place-items-center rounded-full hover:bg-white"
                                aria-label={t("removeAudio")}
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {!currentUser ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          <Link href="/register" className="font-semibold text-primary underline">
                            {t("register")}
                          </Link>
                        </p>
                      ) : null}
                      {composerError ? (
                        <p className="mt-2 text-xs text-destructive">{composerError}</p>
                      ) : null}
                      <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                        <Button type="button" size="sm" variant="ghost" onClick={() => setComposerOpen(false)}>
                          {t("cancel")}
                        </Button>
                        <Button type="submit" size="sm">
                          {t("publishPost")}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => focusComposer()}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <UserAvatar
                        src={currentUser?.avatarUrl}
                        name={currentUser?.name ?? "S"}
                        verified={currentUser?.selfieVerified}
                        className="size-10 shrink-0"
                        textClassName="text-sm"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#222325]">{t("composerPrompt")}</span>
                        <span className="block text-xs text-muted-foreground">{t("composerHint")}</span>
                      </span>
                    </button>
                  )}
                </div>

                {/* Feed Posts List */}
                {feedCards.length === 0 && !feedLoading ? (
                  <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    {filter === "following" ? t("emptyFollowing") : t("empty")}
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {feedCards.map((card) => {
                      const post = db.posts.find((item) => item.id === card.post.id) ?? card.post;
                      const author = userMap.get(card.author.id) ?? card.author;
                      const loved = activeUserId ? post.lovedBy.includes(activeUserId) : false;
                      const following = myFollows.includes(author.id);
                      return (
                        <li key={post.id}>
                          <PostCard
                            post={post}
                            author={author}
                            locale={locale}
                            hydrated={hydrated}
                            loved={loved}
                            following={following}
                            activeUserId={activeUserId}
                            onRequireSignIn={() => router.push("/register")}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div ref={feedEndRef} className="h-8 text-center text-xs text-muted-foreground">
                  {feedLoading ? t("feedLoading") : ""}
                </div>
              </section>

              {/* Right Sidebar: Suggested Musicians Directory */}
              <aside
                aria-labelledby="directory-heading"
                className="rounded-lg border border-border bg-card p-4 shadow-md lg:sticky lg:top-20"
              >
                <div className="flex items-center justify-between gap-2 pb-3">
                  <h2 id="directory-heading" className="font-display text-base font-bold">
                    {t("directoryTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setFilter("musicians")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {formatNumber(visibleMusicians.length, locale)} {t("musiciansCount")}
                  </button>
                </div>

                {visibleMusicians.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">{t("empty")}</p>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {visibleMusicians.slice(0, 6).map((person) => (
                      <li key={person.id} className="py-3 first:pt-1 last:pb-1">
                        <SidebarMusicianRow
                          person={person}
                          locale={locale}
                          following={myFollows.includes(person.id)}
                          activeUserId={activeUserId}
                          onRequireSignIn={() => router.push("/register")}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PostCard({
  post,
  author,
  locale,
  hydrated,
  loved,
  following,
  activeUserId,
  onRequireSignIn,
}: {
  post: CommunityPost;
  author: DbUser;
  locale: string;
  hydrated: boolean;
  loved: boolean;
  following: boolean;
  activeUserId: string | null;
  onRequireSignIn: () => void;
}) {
  const t = useTranslations("Home");
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editCategory, setEditCategory] = useState<PostCategory>(post.category);
  const [editRole, setEditRole] = useState<Role>(post.roleTag);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editText, setEditText] = useState(post.text);
  const [editPrice, setEditPrice] = useState(post.priceBdt ? String(post.priceBdt) : "");
  const [editYoutube, setEditYoutube] = useState(
    post.youtubeId ? `https://www.youtube.com/watch?v=${post.youtubeId}` : "",
  );
  const [editAudio, setEditAudio] = useState(post.audioSrc ?? "");
  const [uploadingEditAudio, setUploadingEditAudio] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const authorName = pick(locale, author.nameBn, author.name);
  const roleLabel = t(`roles.${post.roleTag}`);
  const fullText = pick(locale, post.textBn, post.text);
  const isLong = fullText.length > 260;
  const timeLabel = formatPostTime(post.createdAt, locale, hydrated);
  const isOwnPost = author.id === activeUserId;

  function openEditor() {
    setEditCategory(post.category);
    setEditRole(post.roleTag);
    setEditTitle(post.title);
    setEditText(post.text);
    setEditPrice(post.priceBdt ? String(post.priceBdt) : "");
    setEditYoutube(post.youtubeId ? `https://www.youtube.com/watch?v=${post.youtubeId}` : "");
    setEditAudio(post.audioSrc ?? "");
    setEditError("");
    setEditing(true);
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editTitle.trim() || !editText.trim()) {
      setEditError(t("postRequired"));
      return;
    }
    const ytId = youtubeIdFromUrl(editYoutube);
    if (editYoutube.trim() && !ytId) {
      setEditError(t("badYoutube"));
      return;
    }
    const priceNum = Number(editPrice.replace(/[^\d]/g, ""));
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await mutateCommunity<{ error?: string }>({
        action: "updatePost",
        postId: post.id,
        category: editCategory,
        roleTag: editRole,
        title: editTitle.trim(),
        text: editText.trim(),
        priceBdt: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : undefined,
        youtubeId: ytId || undefined,
        audioSrc: editAudio.trim() || undefined,
      });
      if (res.error) {
        setEditError(res.error);
        return;
      }
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card shadow-md">
      {/* Facebook-style Post Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/u/${author.id}`} className="shrink-0">
            <UserAvatar
              src={author.avatarUrl}
              name={authorName}
              verified={author.selfieVerified}
              className="size-11 ring-1 ring-white/10"
              textClassName="text-sm"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/u/${author.id}`}
                className="truncate text-[15px] font-semibold text-foreground hover:underline"
              >
                {authorName}
              </Link>
              {author.id !== activeUserId ? (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <button
                    type="button"
                    aria-pressed={following}
                    onClick={() => {
                      if (!activeUserId) {
                        onRequireSignIn();
                        return;
                      }
                      void mutateCommunity({
                        action: "toggleFollow",
                        followerId: activeUserId,
                        musicianId: author.id,
                      });
                    }}
                    className={
                      following
                        ? "text-xs font-semibold text-muted-foreground hover:text-foreground"
                        : "text-xs font-semibold text-primary hover:underline"
                    }
                  >
                    {following ? t("followingBtn") : t("followBtn")}
                  </button>
                </>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{t(`roles.${author.roles[0] as Role}`)}</span>
              <span>·</span>
              <span>{pick(locale, author.cityBn, author.city)}</span>
              {timeLabel ? (
                <>
                  <span>·</span>
                  <span>{timeLabel}</span>
                </>
              ) : null}
              <span>·</span>
              <Globe className="size-3" aria-hidden />
            </div>
          </div>
        </div>

        {/* Category & Role Badge + Owner Edit Trigger */}
        <div className="flex shrink-0 items-center gap-2">
          {post.priceBdt ? (
            <span className="rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
              ৳{formatNumber(post.priceBdt, locale)}
            </span>
          ) : null}
          <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
            {t(`categories.${post.category}`)} · {roleLabel}
          </span>
          {isOwnPost ? (
            <button
              type="button"
              onClick={() => (editing ? setEditing(false) : openEditor())}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              title={locale === "bn" ? "পোস্ট সম্পাদনা করো" : "Edit post"}
            >
              <Pencil className="size-3.5" />
              <span>{locale === "bn" ? "সম্পাদনা" : "Edit"}</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Inline Post Editor (for Post Author) */}
      {isOwnPost && editing ? (
        <form
          onSubmit={(e) => void handleSaveEdit(e)}
          className="mx-4 mt-3 mb-3 space-y-2.5 rounded-lg border border-primary/40 bg-secondary p-4"
        >
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setEditCategory(cat)}
                className={
                  editCategory === cat
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                    : "rounded-full bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                }
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
            <span className="mx-1 self-center text-xs text-muted-foreground">·</span>
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setEditRole(r)}
                className={
                  editRole === r
                    ? "rounded-full border border-primary bg-card px-3 py-1 text-xs font-semibold text-primary"
                    : "rounded-full bg-card px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                }
              >
                {t(`roles.${r}`)}
              </button>
            ))}
          </div>

          <div className="grid gap-2.5 sm:grid-cols-[1fr_150px]">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t("postTitlePlaceholder")}
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              placeholder={t("postPricePlaceholder")}
              inputMode="numeric"
              className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <RichTextField
            value={editText}
            onChange={setEditText}
            rows={4}
            placeholder={t("postBodyPlaceholder")}
          />

          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              value={editYoutube}
              onChange={(e) => setEditYoutube(e.target.value)}
              placeholder={t("postYoutubePlaceholder")}
              className="h-9 rounded-xl border border-border bg-card px-3 text-xs"
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium hover:border-primary">
                <Upload className="size-3.5 text-primary" />
                {uploadingEditAudio ? t("uploading") : t("uploadAudio")}
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingEditAudio(true);
                    try {
                      const res = await uploadAudioFile(file);
                      setEditAudio(res.url);
                    } finally {
                      setUploadingEditAudio(false);
                    }
                  }}
                />
              </label>
              <input
                value={editAudio}
                onChange={(e) => setEditAudio(e.target.value)}
                placeholder="/media/farhan-guitar.wav"
                className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-card px-2.5 text-xs"
              />
            </div>
          </div>

          {editError ? <p className="text-xs text-destructive">{editError}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                void mutateCommunity({
                  action: "deletePost",
                  postId: post.id,
                })
              }
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              <span>{locale === "bn" ? "পোস্ট মুছো" : "Delete Post"}</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={savingEdit || uploadingEditAudio}>
                {savingEdit ? "…" : locale === "bn" ? "পরিবর্তন সেভ করো" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        /* Post Title & Body */
        <div className="px-4 pt-3 pb-3">
          <h3 className="text-[16px] font-semibold leading-snug text-foreground">
            {pick(locale, post.titleBn, post.title)}
          </h3>
          <RichText
            text={fullText}
            className={`mt-1.5 space-y-1 text-[14.5px] leading-relaxed text-[#222325] ${
              !expanded && isLong ? "line-clamp-6" : ""
            }`}
          />
          {isLong ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 font-semibold text-foreground hover:underline"
            >
              {expanded
                ? locale === "bn"
                  ? "কম দেখুন"
                  : "See less"
                : locale === "bn"
                  ? "আরও পড়ুন"
                  : "See more"}
            </button>
          ) : null}
        </div>
      )}

      {/* Media Attachment */}
      {post.youtubeId ? (
        <div className="border-t border-border bg-white">
          <YoutubePlayer
            videoId={post.youtubeId}
            title={pick(locale, post.titleBn, post.title)}
          />
        </div>
      ) : null}

      {post.audioSrc ? (
        <div className="px-4 pb-3">
          <AudioPlayer
            src={post.audioSrc}
            title={pick(locale, post.titleBn, post.title)}
          />
        </div>
      ) : null}

      {/* Facebook Reaction Count Row */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="size-2.5" fill="currentColor" />
          </span>
          <span>
            {formatNumber(post.loves, locale)} {t("loveBtn")}
          </span>
        </div>
        <span>
          {t(`categories.${post.category}`)} · {roleLabel}
        </span>
      </div>

      {/* Facebook Action Footer */}
      <div className="mx-3 grid grid-cols-3 gap-1 border-t border-border py-1.5 text-xs font-semibold">
        <button
          type="button"
          aria-pressed={loved}
          onClick={() => {
            if (!activeUserId) {
              onRequireSignIn();
              return;
            }
            void mutateCommunity({
              action: "toggleLove",
              postId: post.id,
              userId: activeUserId,
            });
          }}
          className={
            loved
              ? "inline-flex items-center justify-center gap-2 rounded-lg py-2 text-primary transition-colors hover:bg-secondary"
              : "inline-flex items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          }
        >
          <Heart className="size-4" fill={loved ? "currentColor" : "none"} />
          <span>{t("loveBtn")}</span>
        </button>

        {!isOwnPost ? (
          <button
            type="button"
            onClick={() => {
              if (!activeUserId) {
                onRequireSignIn();
                return;
              }
              openChatWindow(author.id, post.id);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <MessageCircle className="size-4" />
            <span>{t("messageBtn")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (editing ? setEditing(false) : openEditor())}
            className="inline-flex items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="size-4" />
            <span>{locale === "bn" ? "পোস্ট সম্পাদনা" : "Edit Post"}</span>
          </button>
        )}

        <Link
          href={`/u/${author.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <UserRound className="size-4" />
          <span>{t("openProfile")}</span>
        </Link>
      </div>
    </article>
  );
}

function SidebarMusicianRow({
  person,
  locale,
  following,
  activeUserId,
  onRequireSignIn,
}: {
  person: Musician;
  locale: string;
  following: boolean;
  activeUserId: string | null;
  onRequireSignIn: () => void;
}) {
  const t = useTranslations("Home");
  const name = pick(locale, person.nameBn, person.name);
  const role = t(`roles.${person.roles[0] as Role}`);

  return (
    <div className="flex items-start justify-between gap-3">
      <Link href={`/u/${person.id}`} className="group flex min-w-0 items-center gap-3">
        <UserAvatar
          src={person.avatarUrl}
          name={name}
          verified={person.selfieVerified}
          className="size-10 shrink-0"
          textClassName="text-sm"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
            {name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {role} · {pick(locale, person.cityBn, person.city)} · ★ {formatRating(person.rating, locale)}
          </span>
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-1.5">
        {person.id !== activeUserId ? (
          <>
            <button
              type="button"
              onClick={() => {
                if (!activeUserId) {
                  onRequireSignIn();
                  return;
                }
                openChatWindow(person.id);
              }}
              className="grid size-8 place-items-center rounded-full border border-border bg-secondary text-foreground hover:border-primary"
              aria-label={t("messageBtn")}
              title={t("messageBtn")}
            >
              <MessageCircle className="size-3.5 text-primary" />
            </button>
            <button
              type="button"
              aria-pressed={following}
              onClick={() => {
                if (!activeUserId) {
                  onRequireSignIn();
                  return;
                }
                void mutateCommunity({
                  action: "toggleFollow",
                  followerId: activeUserId,
                  musicianId: person.id,
                });
              }}
              className={
                following
                  ? "inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                  : "inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/25"
              }
            >
              {following ? <UserCheck className="size-3" /> : <UserPlus className="size-3" />}
              <span>{following ? t("followingBtn") : t("followBtn")}</span>
            </button>
          </>
        ) : (
          <Link
            href={`/u/${person.id}`}
            className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
          >
            {t("openProfile")}
          </Link>
        )}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  locale,
  following,
  activeUserId,
  onRequireSignIn,
}: {
  person: Musician;
  locale: string;
  following: boolean;
  activeUserId: string | null;
  onRequireSignIn: () => void;
}) {
  const t = useTranslations("Home");
  const name = pick(locale, person.nameBn, person.name);
  const role = t(`roles.${person.roles[0] as Role}`);

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-md border border-[#e4e5e7] bg-white transition-shadow hover:shadow-md">
      <div>
        <div className="relative z-0 h-44 w-full overflow-hidden">
          {person.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.coverUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: `center ${person.coverPositionY ?? 50}%` }}
            />
          ) : (
            <DefaultCoverArt
              seed={person.id + person.name}
              role={person.roles[0]}
              hints={[...person.genres, ...person.genreTerms, ...person.instruments]}
              positionY={person.coverPositionY ?? 50}
              compact
            />
          )}
        </div>
        <div className="px-4 pb-4">
          <UserAvatar
            src={person.avatarUrl}
            name={name}
            verified={person.selfieVerified}
            className="relative z-10 -mt-8 size-14 border-4 border-white"
            textClassName="text-lg"
          />
          <div className="mt-2 flex items-start justify-between gap-2">
            <Link href={`/u/${person.id}`} className="group min-w-0">
              <span className="block truncate font-semibold text-[#222325] group-hover:underline">
                {name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {role} · {pick(locale, person.cityBn, person.city)}
              </span>
            </Link>

            {person.id !== activeUserId ? (
              <button
                type="button"
                aria-pressed={following}
                onClick={() => {
                  if (!activeUserId) {
                    onRequireSignIn();
                    return;
                  }
                  void mutateCommunity({
                    action: "toggleFollow",
                    followerId: activeUserId,
                    musicianId: person.id,
                  });
                }}
                className={
                  following
                    ? "shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground"
                    : "shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                }
              >
                {following ? t("followingBtn") : t("followBtn")}
              </button>
            ) : null}
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {pick(locale, person.bioBn, person.bio)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <StarRating value={person.rating} label={t("rating")} />
          <span>{formatRating(person.rating, locale)}</span>
          {person.priceFromBdt ? (
            <span className="font-semibold text-foreground">
              {locale === "bn"
                ? `৳${formatNumber(person.priceFromBdt, locale)} থেকে`
                : `From ৳${formatNumber(person.priceFromBdt, locale)}`}
            </span>
          ) : null}
        </span>
        <div className="flex items-center gap-2">
          {person.id !== activeUserId ? (
            <button
              type="button"
              onClick={() => {
                if (!activeUserId) {
                  onRequireSignIn();
                  return;
                }
                openChatWindow(person.id);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 text-foreground hover:border-primary"
            >
              <MessageCircle className="size-3 text-primary" />
              {t("messageBtn")}
            </button>
          ) : null}
          <Link
            href={`/u/${person.id}`}
            className="font-medium text-foreground underline decoration-primary underline-offset-4"
          >
            {t("openProfile")}
          </Link>
        </div>
      </div>
    </div>
  );
}
