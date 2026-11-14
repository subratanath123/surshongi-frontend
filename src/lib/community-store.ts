"use client";

import { useSyncExternalStore } from "react";
import { apiUrl } from "@/lib/api-base";
import { createSeedDatabase } from "@/lib/db-seed";
import type { ChatMessage, CommunityDatabase, DbUser } from "@/lib/db-types";

export type OpenChatWindow = {
  musicianId: string;
  minimized: boolean;
  /** Post the next message should quote, set when Message is clicked on a post. */
  postId?: string;
};

type ClientStoreState = {
  db: CommunityDatabase;
  currentUserId: string | null;
  ssoConfigured: boolean;
  googleClientId: string;
  chatWindows: OpenChatWindow[];
  hydrated: boolean;
  /** In-flight saves, so buttons can spin while the API catches up. */
  pendingKeys: string[];
};

const legacySessionKey = "sur_session_user_id";
const chatWindowsKey = "sur_open_chat_windows";
const storeEvent = "sur-community-store";
const POLL_INTERVAL_MS = 1500;

let state: ClientStoreState = {
  db: createSeedDatabase(),
  currentUserId: null,
  ssoConfigured: false,
  googleClientId: "",
  chatWindows: [],
  hydrated: false,
  pendingKeys: [],
};

let lastDbJson = "";
let knownMessageIds = new Set<string>();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollingInFlight = false;

const serverSnapshot: ClientStoreState = state;

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(storeEvent));
  }
}

function applyIncomingDatabase(nextDb: CommunityDatabase, isInitial = false) {
  if (!nextDb || !Array.isArray(nextDb.users)) return;

  const nextJson = JSON.stringify(nextDb);
  const changed = nextJson !== lastDbJson;
  lastDbJson = nextJson;

  // Detect brand-new incoming messages for the signed-in user and auto-open their chat window
  let updatedChatWindows = state.chatWindows;
  const myId = state.currentUserId;

  if (!isInitial && myId && Array.isArray(nextDb.messages)) {
    for (const msg of nextDb.messages) {
      if (
        !knownMessageIds.has(msg.id) &&
        msg.toId === myId &&
        msg.fromId !== myId
      ) {
        const alreadyOpen = updatedChatWindows.some((w) => w.musicianId === msg.fromId);
        updatedChatWindows = alreadyOpen
          ? updatedChatWindows.map((w) =>
              w.musicianId === msg.fromId ? { ...w, minimized: false } : w,
            )
          : [...updatedChatWindows.slice(-2), { musicianId: msg.fromId, minimized: false }];
      }
    }
  }

  if (Array.isArray(nextDb.messages)) {
    knownMessageIds = new Set(nextDb.messages.map((m) => m.id));
  }

  if (changed || updatedChatWindows !== state.chatWindows || !state.hydrated) {
    state = {
      ...state,
      db: nextDb,
      chatWindows: updatedChatWindows,
      hydrated: true,
    };
    if (typeof window !== "undefined" && updatedChatWindows !== state.chatWindows) {
      window.localStorage.setItem(chatWindowsKey, JSON.stringify(updatedChatWindows));
    }
    emit();
  }
}

async function pollCommunityDatabase() {
  if (typeof window === "undefined" || pollingInFlight) return;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

  pollingInFlight = true;
  try {
    const res = await fetch(apiUrl("/community-data"), { cache: "no-store" });
    if (!res.ok) return;
    const db = (await res.json()) as CommunityDatabase;
    // A slow poll must not undo a follow or preference the user just toggled.
    if (state.pendingKeys.length > 0) return;
    applyIncomingDatabase(db, false);
  } catch {
    // ignore transient poll errors
  } finally {
    pollingInFlight = false;
  }
}

function startPolling() {
  if (typeof window === "undefined" || pollTimer !== null) return;
  pollTimer = setInterval(() => {
    void pollCommunityDatabase();
  }, POLL_INTERVAL_MS);

  window.addEventListener("focus", () => {
    void pollCommunityDatabase();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void pollCommunityDatabase();
    }
  });
}

let fetchStarted = false;

function ensureHydrated() {
  if (typeof window === "undefined" || fetchStarted) return;
  fetchStarted = true;
  const savedChatsRaw = window.localStorage.getItem(chatWindowsKey);
  let savedChats: OpenChatWindow[] = [];
  if (savedChatsRaw) {
    try {
      const parsed = JSON.parse(savedChatsRaw) as OpenChatWindow[];
      if (Array.isArray(parsed)) savedChats = parsed;
    } catch {
      savedChats = [];
    }
  }
  state = {
    ...state,
    chatWindows: savedChats,
  };

  void Promise.all([
    fetch(apiUrl("/community-data"), { cache: "no-store" }).then((res) => res.json()),
    fetch(apiUrl("/auth/session"), { cache: "no-store" }).then((res) => res.json()),
  ])
    .then(
      ([db, session]: [
        CommunityDatabase,
        { user: DbUser | null; ssoConfigured: boolean; googleClientId?: string },
      ]) => {
        const resolvedUserId = session?.user?.id ?? null;

        state = {
          ...state,
          currentUserId: resolvedUserId,
          ssoConfigured: Boolean(session?.ssoConfigured),
          googleClientId: session?.googleClientId ?? "",
          hydrated: true,
        };
        window.localStorage.removeItem(legacySessionKey);
        applyIncomingDatabase(db, true);
        startPolling();
      },
    )
    .catch(() => {
      state = { ...state, hydrated: true };
      emit();
      startPolling();
    });
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(storeEvent, callback);
  if (!fetchStarted) {
    queueMicrotask(() => {
      ensureHydrated();
      emit();
    });
  }
  return () => window.removeEventListener(storeEvent, callback);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return serverSnapshot;
}

export function useCommunityStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCurrentUser(): DbUser | null {
  const { db, currentUserId } = useCommunityStore();
  if (!currentUserId) return null;
  return db.users.find((u) => u.id === currentUserId) ?? null;
}

export function useFollowBusy(musicianId: string) {
  const { pendingKeys } = useCommunityStore();
  return pendingKeys.includes(`follow:${musicianId}`);
}

export function usePrefsBusy() {
  const { pendingKeys } = useCommunityStore();
  return pendingKeys.includes("prefs");
}

export function useSaveBusy() {
  const { pendingKeys } = useCommunityStore();
  return pendingKeys.length > 0;
}

function saveChatWindows(next: OpenChatWindow[]) {
  state = { ...state, chatWindows: next };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(chatWindowsKey, JSON.stringify(next));
  }
  emit();
}

export function openChatWindow(musicianId: string, postId?: string) {
  if (state.currentUserId && musicianId === state.currentUserId) {
    return;
  }
  const exists = state.chatWindows.some((w) => w.musicianId === musicianId);
  const next = exists
    ? state.chatWindows.map((w) =>
        w.musicianId === musicianId
          ? { ...w, minimized: false, postId: postId ?? w.postId }
          : w,
      )
    : [...state.chatWindows.slice(-2), { musicianId, minimized: false, postId }];
  saveChatWindows(next);
}

export function clearChatPostRef(musicianId: string) {
  const next = state.chatWindows.map((w) =>
    w.musicianId === musicianId ? { ...w, postId: undefined } : w,
  );
  saveChatWindows(next);
}

export function toggleMinimizeChatWindow(musicianId: string) {
  const next = state.chatWindows.map((w) =>
    w.musicianId === musicianId ? { ...w, minimized: !w.minimized } : w,
  );
  saveChatWindows(next);
}

export function closeChatWindow(musicianId: string) {
  const next = state.chatWindows.filter((w) => w.musicianId !== musicianId);
  saveChatWindows(next);
}

/** Signing in only happens server-side through Google; this is used to sign out. */
export async function setSessionUser(userId: null) {
  state = { ...state, currentUserId: userId, chatWindows: [] };
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(chatWindowsKey);
    await fetch(apiUrl("/auth/session"), { method: "DELETE" });
    const res = await fetch(apiUrl("/community-data"), { cache: "no-store" });
    if (res.ok) applyIncomingDatabase((await res.json()) as CommunityDatabase, true);
  }
  emit();
}

export function applyAuthenticatedUser(db: CommunityDatabase, user: DbUser) {
  state = {
    ...state,
    currentUserId: user.id,
    hydrated: true,
  };
  applyIncomingDatabase(db, true);
}

export async function mutateCommunity<T = { db: CommunityDatabase; user?: DbUser }>(
  payload: Record<string, unknown>,
): Promise<T> {
  let previousDb: CommunityDatabase | null = null;
  let pendingKey = "save";

  if (
    payload.action === "toggleFollow" &&
    typeof payload.followerId === "string" &&
    typeof payload.musicianId === "string"
  ) {
    pendingKey = `follow:${payload.musicianId}`;
    previousDb = state.db;
    const followerId = payload.followerId;
    const musicianId = payload.musicianId;
    const list = [...(state.db.follows[followerId] ?? [])];
    const index = list.indexOf(musicianId);
    if (index >= 0) list.splice(index, 1);
    else list.push(musicianId);
    state = {
      ...state,
      db: { ...state.db, follows: { ...state.db.follows, [followerId]: list } },
    };
  } else if (payload.action === "updateFeedPreferences" && Array.isArray(payload.preferences)) {
    pendingKey = "prefs";
    previousDb = state.db;
    const userId = state.currentUserId;
    const preferences = payload.preferences.filter((item): item is string => typeof item === "string");
    if (userId) {
      state = {
        ...state,
        db: {
          ...state.db,
          users: state.db.users.map((user) =>
            user.id === userId ? { ...user, feedPreferences: preferences } : user,
          ),
        },
      };
    }
  } else if (
    payload.action === "sendMessage" &&
    typeof payload.fromId === "string" &&
    typeof payload.toId === "string" &&
    (typeof payload.text === "string" ||
      typeof payload.attachmentUrl === "string" ||
      typeof payload.postId === "string")
  ) {
    pendingKey = "";
    const attachmentUrl =
      typeof payload.attachmentUrl === "string" ? payload.attachmentUrl : undefined;
    const attachmentKind =
      payload.attachmentKind === "video" || payload.attachmentKind === "audio"
        ? payload.attachmentKind
        : undefined;
    const attachmentName =
      typeof payload.attachmentName === "string" ? payload.attachmentName : undefined;
    const rawText = typeof payload.text === "string" ? payload.text.trim() : "";
    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now().toString(36)}`,
      fromId: payload.fromId,
      toId: payload.toId,
      text:
        rawText ||
        (attachmentUrl
          ? `📎 ${attachmentKind === "video" ? "Video" : "Audio"}: ${attachmentName ?? "attachment"}`
          : ""),
      attachmentUrl,
      attachmentKind,
      attachmentName,
      postId: typeof payload.postId === "string" ? payload.postId : undefined,
      createdAt: new Date().toISOString(),
    };
    knownMessageIds.add(optimisticMsg.id);
    state = {
      ...state,
      db: {
        ...state.db,
        messages: [...state.db.messages, optimisticMsg],
      },
    };
  }

  if (pendingKey && !state.pendingKeys.includes(pendingKey)) {
    state = { ...state, pendingKeys: [...state.pendingKeys, pendingKey] };
  }
  emit();
  const startedAt = Date.now();

  try {
    const res = await fetch(apiUrl("/community-data"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await res.text();
    let data: T & { db?: CommunityDatabase; user?: DbUser; error?: string };
    try {
      data = JSON.parse(text) as T & { db?: CommunityDatabase; user?: DbUser; error?: string };
    } catch {
      throw new Error(res.ok ? "Could not read the server response." : `Could not save (${res.status}).`);
    }
    if (!res.ok) {
      if (previousDb) {
        state = { ...state, db: previousDb };
        previousDb = null;
        emit();
      }
      if (!data.error) throw new Error(`Could not save (${res.status}).`);
      return data;
    }
    if (data.db) {
      applyIncomingDatabase(data.db, false);
    }
    return data;
  } catch (err) {
    if (previousDb) {
      state = { ...state, db: previousDb };
      emit();
    }
    throw err;
  } finally {
    if (pendingKey && state.pendingKeys.includes(pendingKey)) {
      const remain = 450 - (Date.now() - startedAt);
      if (remain > 0) await new Promise((resolve) => setTimeout(resolve, remain));
      state = { ...state, pendingKeys: state.pendingKeys.filter((key) => key !== pendingKey) };
      emit();
    }
  }
}

export async function uploadAudioFile(
  file: File,
): Promise<{ url: string; name: string; kind?: "image" | "audio" | "video" }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(apiUrl("/community-upload"), {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error("Upload failed");
  }
  return (await res.json()) as { url: string; name: string; kind?: "image" | "audio" | "video" };
}
