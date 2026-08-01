import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { ACHIEVEMENTS } from "./config";
import { sfx, setSoundEnabled, vibrate } from "./sound";
import {
  defaultSave,
  loadLocal,
  mergeSaves,
  normalize,
  saveLocal,
  clearLocal,
  type SaveData,
} from "./storage";

export type Profile = { id: string; username: string; avatar: string; created_at: string };

type SyncState = "local" | "syncing" | "synced" | "offline";

type GameContextValue = {
  save: SaveData;
  update: (fn: (draft: SaveData) => SaveData) => void;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  syncState: SyncState;
  unlock: (id: string) => void;
  addCoins: (amount: number) => void;
  popup: { emoji: string; title: string; text: string } | null;
  dismissPopup: () => void;
  showToast: (emoji: string, title: string, text: string) => void;
  signOut: () => Promise<void>;
  resetProgress: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (patch: { username?: string; avatar?: string }) => Promise<void>;
  buzz: (pattern: number | number[]) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(() => defaultSave());
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [popup, setPopup] = useState<{ emoji: string; title: string; text: string } | null>(null);
  const hydrated = useRef(false);
  const saveRef = useRef(save);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  saveRef.current = save;

  // 1. Hydrate from localStorage on the client.
  useEffect(() => {
    const local = loadLocal();
    setSave(local);
    setSoundEnabled(local.settings.sound);
    hydrated.current = true;
    setLoading(false);
  }, []);

  // 2. Track auth session.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 3. When signed in, pull cloud save and merge with local (never overwrite silently).
  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    const userId = session.user.id;
    setSyncState("syncing");
    void (async () => {
      try {
        const [{ data: prof }, { data: row }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase.from("game_progress").select("data").eq("user_id", userId).maybeSingle(),
        ]);
        if (cancelled) return;
        if (prof) setProfile(prof as Profile);
        const cloud = normalize(row?.data ?? {});
        const merged = mergeSaves(saveRef.current, cloud);
        if (prof?.avatar) merged.avatar = prof.avatar;
        setSave(merged);
        saveLocal(merged);
        setSoundEnabled(merged.settings.sound);
        await supabase
          .from("game_progress")
          .upsert({ user_id: userId, data: merged as unknown as Json });
        if (!cancelled) setSyncState("synced");
      } catch {
        if (!cancelled) setSyncState("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const pushCloud = useCallback(
    (data: SaveData) => {
      if (!session?.user) return;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => {
        setSyncState("syncing");
        void supabase
          .from("game_progress")
          .upsert({ user_id: session.user.id, data: data as unknown as Json })
          .then(({ error }) => setSyncState(error ? "offline" : "synced"));
      }, 900);
    },
    [session],
  );

  const update = useCallback(
    (fn: (draft: SaveData) => SaveData) => {
      setSave((prev) => {
        const next = { ...fn({ ...prev }), updatedAt: Date.now() };
        saveLocal(next);
        setSoundEnabled(next.settings.sound);
        pushCloud(next);
        return next;
      });
    },
    [pushCloud],
  );

  const showToast = useCallback((emoji: string, title: string, text: string) => {
    setPopup({ emoji, title, text });
  }, []);

  const unlock = useCallback(
    (id: string) => {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      if (saveRef.current.achievements.includes(id)) return;
      update((d) => ({
        ...d,
        achievements: [...d.achievements, id],
        coins: d.coins + def.reward,
        stats: { ...d.stats, coinsEarned: d.stats.coinsEarned + def.reward },
      }));
      sfx.achievement();
      setPopup({
        emoji: def.emoji,
        title: `Achievement unlocked — ${def.name}`,
        text: `${def.description} · +${def.reward} coins`,
      });
    },
    [update],
  );

  const addCoins = useCallback(
    (amount: number) => {
      update((d) => ({
        ...d,
        coins: d.coins + amount,
        stats: { ...d.stats, coinsEarned: d.stats.coinsEarned + amount },
      }));
    },
    [update],
  );

  const buzz = useCallback((pattern: number | number[]) => {
    vibrate(pattern, saveRef.current.settings.vibration);
  }, []);

  const signOut = useCallback(async () => {
    if (session?.user) {
      try {
        await supabase
          .from("game_progress")
          .upsert({ user_id: session.user.id, data: saveRef.current as unknown as Json });
      } catch {
        /* keep local copy */
      }
    }
    await supabase.auth.signOut();
    setProfile(null);
  }, [session]);

  const resetProgress = useCallback(async () => {
    const fresh = { ...defaultSave(), updatedAt: Date.now() };
    setSave(fresh);
    clearLocal();
    saveLocal(fresh);
    if (session?.user) {
      await supabase
        .from("game_progress")
        .upsert({ user_id: session.user.id, data: fresh as unknown as Json });
    }
  }, [session]);

  const deleteAccount = useCallback(async () => {
    if (!session?.user) return;
    await supabase.from("game_progress").delete().eq("user_id", session.user.id);
    await supabase.from("profiles").delete().eq("id", session.user.id);
    await supabase.auth.signOut();
    clearLocal();
    setSave(defaultSave());
    setProfile(null);
  }, [session]);

  const updateProfile = useCallback(
    async (patch: { username?: string; avatar?: string }) => {
      if (patch.avatar) update((d) => ({ ...d, avatar: patch.avatar! }));
      if (patch.username) update((d) => ({ ...d, guestName: patch.username! }));
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id)
        .select()
        .maybeSingle();
      if (data) setProfile(data as Profile);
    },
    [session, update],
  );

  // Apply the selected theme to the document.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset["theme"] = save.theme;
    document.documentElement.dataset["motion"] = save.settings.animations ? "on" : "off";
  }, [save.theme, save.settings.animations]);

  const value = useMemo<GameContextValue>(
    () => ({
      save,
      update,
      session,
      profile,
      loading,
      syncState,
      unlock,
      addCoins,
      popup,
      dismissPopup: () => setPopup(null),
      showToast,
      signOut,
      resetProgress,
      deleteAccount,
      updateProfile,
      buzz,
    }),
    [
      save,
      update,
      session,
      profile,
      loading,
      syncState,
      unlock,
      addCoins,
      popup,
      showToast,
      signOut,
      resetProgress,
      deleteAccount,
      updateProfile,
      buzz,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
