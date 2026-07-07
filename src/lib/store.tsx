"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { nanoid } from "nanoid";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { getDb, getFirebaseAuth, firebaseConfigured } from "./firebase";
import type { Exercise, Template, UserBackup, Workout } from "./types";

/* -------------------------------------------------------------------------- */
/*  Local fallback store (used when Firebase isn't configured)                */
/* -------------------------------------------------------------------------- */

const LS_KEY = "gym-tracker:v1";

interface LocalState {
  workouts: Workout[];
  templates: Template[];
  exercises: Exercise[];
}

function readLocal(): LocalState {
  if (typeof window === "undefined") return { workouts: [], templates: [], exercises: [] };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { workouts: [], templates: [], exercises: [] };
    return JSON.parse(raw) as LocalState;
  } catch {
    return { workouts: [], templates: [], exercises: [] };
  }
}

function writeLocal(state: LocalState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

interface StoreState {
  ready: boolean;
  user: User | null;
  cloudEnabled: boolean;
  workouts: Workout[];
  templates: Template[];
  exercises: Exercise[];
  signInGoogle: () => Promise<void>;
  signInAnon: () => Promise<void>;
  signOut: () => Promise<void>;
  saveWorkout: (w: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  saveTemplate: (t: Template) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  saveExercise: (e: Exercise) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  importBackup: (b: UserBackup, mode: "merge" | "replace") => Promise<void>;
  exportBackup: () => Promise<UserBackup>;
}

const StoreContext = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // ---------- Auth ----------
  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return;
    }
    // Offline persistence is enabled at Firestore initialization in `lib/firebase.ts`.
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("[auth] onAuthStateChanged ->", u ? `user ${u.uid} (${u.isAnonymous ? "anon" : "google"})` : "null");
      setUser(u);
      setAuthReady(true);
    });
    // Pick up the credential after a signInWithRedirect round-trip.
    getRedirectResult(auth)
      .then((res) => {
        console.log("[auth] getRedirectResult ->", res ? `user ${res.user.uid}` : "null (no pending redirect)");
      })
      .catch((e) => console.error("[auth] getRedirectResult error:", e?.code, e?.message, e));
    return () => unsub();
  }, []);

  // ---------- Local fallback subscription ----------
  useEffect(() => {
    if (firebaseConfigured) return;
    const local = readLocal();
    setWorkouts(local.workouts);
    setTemplates(local.templates);
    setExercises(local.exercises);
  }, []);

  // ---------- Cloud subscriptions ----------
  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const db = getDb();
    if (!db) return;

    const wQ = query(collection(db, "users", user.uid, "workouts"), orderBy("date", "desc"));
    const tQ = query(collection(db, "users", user.uid, "templates"), orderBy("name"));
    const eQ = query(collection(db, "users", user.uid, "exercises"), orderBy("name"));

    const unw = onSnapshot(wQ, (snap) => setWorkouts(snap.docs.map((d) => toWorkout(d.id, d.data()))));
    const unt = onSnapshot(tQ, (snap) => setTemplates(snap.docs.map((d) => toTemplate(d.id, d.data()))));
    const une = onSnapshot(eQ, (snap) => setExercises(snap.docs.map((d) => toExercise(d.id, d.data()))));

    return () => {
      unw();
      unt();
      une();
    };
  }, [user]);

  // ---------- Seed defaults on first sign-in ----------
  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    const db = getDb();
    if (!db) return;
    (async () => {
      const seedKey = `gym-tracker:seeded:${user.uid}`;
      if (window.localStorage.getItem(seedKey)) return;
      const batch = writeBatch(db);
      const base = Date.now();
      for (const ex of DEFAULT_EXERCISES) {
        const ref = doc(collection(db, "users", user.uid, "exercises"));
        batch.set(ref, { ...ex, createdAt: base });
      }
      for (const t of DEFAULT_TEMPLATES) {
        const ref = doc(collection(db, "users", user.uid, "templates"));
        batch.set(ref, { ...stripIds(t), createdAt: base, updatedAt: base });
      }
      await batch.commit();
      window.localStorage.setItem(seedKey, "1");
    })();
  }, [user]);

  // Local-only seeding
  useEffect(() => {
    if (firebaseConfigured) return;
    const local = readLocal();
    if (local.exercises.length === 0 && local.templates.length === 0) {
      const next = {
        workouts: local.workouts,
        exercises: DEFAULT_EXERCISES.map((e, i) => ({ ...e, id: `e_${i}` })),
        templates: DEFAULT_TEMPLATES.map((t, i) => ({ ...stripIds(t), id: `t_${i}`, createdAt: Date.now(), updatedAt: Date.now() })),
      };
      writeLocal(next);
      setExercises(next.exercises);
      setTemplates(next.templates);
    }
  }, []);

  // ---------- Helpers ----------
  const persistLocal = useCallback((mut: (s: LocalState) => LocalState) => {
    const next = mut(readLocal());
    writeLocal(next);
    setWorkouts(next.workouts);
    setTemplates(next.templates);
    setExercises(next.exercises);
  }, []);

  const signInGoogle = useCallback(async () => {
    console.log("[auth] signInGoogle called, configured=", firebaseConfigured);
    const auth = getFirebaseAuth();
    console.log("[auth] auth instance:", auth);
    if (!auth) throw new Error("Firebase not configured");
    try {
      console.log("[auth] calling signInWithPopup...");
      await signInWithPopup(auth, new GoogleAuthProvider());
      console.log("[auth] signInWithPopup resolved");
    } catch (e) {
      console.error("[auth] signInWithPopup threw:", e);
      // If popup is blocked or fails, fall back to redirect
      console.log("[auth] falling back to signInWithRedirect");
      await signInWithRedirect(auth, new GoogleAuthProvider());
      console.log("[auth] signInWithRedirect resolved (page should be navigating away)");
    }
  }, []);

  const signInAnon = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
    await signInAnonymously(auth);
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  }, []);

  /* ---- workouts ---- */
  const saveWorkout = useCallback(
    async (w: Workout) => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        const ref = w.id ? doc(db, "users", user.uid, "workouts", w.id) : doc(collection(db, "users", user.uid, "workouts"));
        await setDoc(ref, { ...w, updatedAt: serverTimestamp() }, { merge: false });
        return;
      }
      persistLocal((s) => {
        const i = s.workouts.findIndex((x) => x.id === w.id);
        const next = { ...w, updatedAt: Date.now() };
        const arr = [...s.workouts];
        if (i >= 0) arr[i] = next;
        else arr.unshift({ ...next, id: w.id || nanoid(10), createdAt: Date.now() });
        return { ...s, workouts: arr };
      });
    },
    [user, persistLocal]
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        await deleteDoc(doc(db, "users", user.uid, "workouts", id));
        return;
      }
      persistLocal((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
    },
    [user, persistLocal]
  );

  /* ---- templates ---- */
  const saveTemplate = useCallback(
    async (t: Template) => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        const ref = t.id ? doc(db, "users", user.uid, "templates", t.id) : doc(collection(db, "users", user.uid, "templates"));
        await setDoc(ref, { ...t, updatedAt: serverTimestamp() }, { merge: false });
        return;
      }
      persistLocal((s) => {
        const i = s.templates.findIndex((x) => x.id === t.id);
        const arr = [...s.templates];
        const next = { ...t, updatedAt: Date.now() };
        if (i >= 0) arr[i] = next;
        else arr.push({ ...next, id: t.id || nanoid(10), createdAt: Date.now() });
        return { ...s, templates: arr };
      });
    },
    [user, persistLocal]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        await deleteDoc(doc(db, "users", user.uid, "templates", id));
        return;
      }
      persistLocal((s) => ({ ...s, templates: s.templates.filter((t) => t.id !== id) }));
    },
    [user, persistLocal]
  );

  /* ---- exercises ---- */
  const saveExercise = useCallback(
    async (e: Exercise) => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        const ref = e.id ? doc(db, "users", user.uid, "exercises", e.id) : doc(collection(db, "users", user.uid, "exercises"));
        await setDoc(ref, { ...e }, { merge: false });
        return;
      }
      persistLocal((s) => {
        const i = s.exercises.findIndex((x) => x.id === e.id);
        const arr = [...s.exercises];
        if (i >= 0) arr[i] = e;
        else arr.push({ ...e, id: e.id || nanoid(8) });
        return { ...s, exercises: arr };
      });
    },
    [user, persistLocal]
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        await deleteDoc(doc(db, "users", user.uid, "exercises", id));
        return;
      }
      persistLocal((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) }));
    },
    [user, persistLocal]
  );

  /* ---- backup ---- */
  const exportBackup = useCallback(async (): Promise<UserBackup> => {
    return {
      version: 1,
      exportedAt: Date.now(),
      workouts,
      templates,
      exercises,
    };
  }, [workouts, templates, exercises]);

  const importBackup = useCallback(
    async (b: UserBackup, mode: "merge" | "replace") => {
      if (firebaseConfigured && user) {
        const db = getDb();
        if (!db) return;
        const batch = writeBatch(db);
        const ref = (col: string) => collection(db, "users", user.uid, col);
        if (mode === "replace") {
          for (const w of workouts) batch.delete(doc(ref("workouts"), w.id));
          for (const t of templates) batch.delete(doc(ref("templates"), t.id));
          for (const e of exercises) batch.delete(doc(ref("exercises"), e.id));
        }
        for (const w of b.workouts) batch.set(doc(ref("workouts"), w.id), w, { merge: mode === "merge" });
        for (const t of b.templates) batch.set(doc(ref("templates"), t.id), t, { merge: mode === "merge" });
        for (const e of b.exercises) batch.set(doc(ref("exercises"), e.id), e, { merge: mode === "merge" });
        await batch.commit();
        return;
      }
      persistLocal((s) => {
        const wm = new Map(s.workouts.map((w) => [w.id, w]));
        for (const w of b.workouts) wm.set(w.id, w);
        const tm = new Map(s.templates.map((t) => [t.id, t]));
        for (const t of b.templates) tm.set(t.id, t);
        const em = new Map(s.exercises.map((e) => [e.id, e]));
        for (const e of b.exercises) em.set(e.id, e);
        return { workouts: [...wm.values()], templates: [...tm.values()], exercises: [...em.values()] };
      });
    },
    [user, workouts, templates, exercises, persistLocal]
  );

  const value = useMemo<StoreState>(
    () => ({
      ready: authReady,
      user,
      cloudEnabled: firebaseConfigured,
      workouts,
      templates,
      exercises,
      signInGoogle,
      signInAnon,
      signOut: signOutUser,
      saveWorkout,
      deleteWorkout,
      saveTemplate,
      deleteTemplate,
      saveExercise,
      deleteExercise,
      importBackup,
      exportBackup,
    }),
    [
      authReady,
      user,
      workouts,
      templates,
      exercises,
      signInGoogle,
      signInAnon,
      signOutUser,
      saveWorkout,
      deleteWorkout,
      saveTemplate,
      deleteTemplate,
      saveExercise,
      deleteExercise,
      importBackup,
      exportBackup,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*  Defaults seeded on first sign-in                                           */
/* -------------------------------------------------------------------------- */

const DEFAULT_EXERCISES: Exercise[] = [
  { id: "ex_press_iso", name: "Press isolateral", defaultUnit: "kg", category: "push" },
  { id: "ex_fly", name: "Fly", defaultUnit: "plate", category: "push" },
  { id: "ex_lat_raise", name: "Lateral raise", defaultUnit: "kg", category: "push" },
  { id: "ex_tri_ext", name: "Tricep extension", defaultUnit: "plate", category: "push" },
  { id: "ex_lat_pull", name: "Lat pulldown", defaultUnit: "plate", category: "pull" },
  { id: "ex_low_row", name: "Low row", defaultUnit: "kg", category: "pull" },
  { id: "ex_spider_curl", name: "Spider curl", defaultUnit: "kg", category: "pull" },
];

const DEFAULT_TEMPLATES: Array<Template & { id: string }> = [
  {
    id: "tpl_push",
    name: "Push",
    createdAt: 0,
    updatedAt: 0,
    items: [
      { exerciseName: "Press isolateral", defaultSets: 3, defaultReps: 8, defaultWeight: 5, defaultUnit: "kg" },
      { exerciseName: "Fly", defaultSets: 3, defaultReps: 10, defaultWeight: 4, defaultUnit: "plate" },
      { exerciseName: "Lateral raise", defaultSets: 3, defaultReps: 10, defaultWeight: 6, defaultUnit: "kg" },
      { exerciseName: "Tricep extension", defaultSets: 3, defaultReps: 8, defaultWeight: 2, defaultUnit: "plate" },
    ],
  },
  {
    id: "tpl_pull",
    name: "Pull",
    createdAt: 0,
    updatedAt: 0,
    items: [
      { exerciseName: "Lat pulldown", defaultSets: 3, defaultReps: 8, defaultWeight: 6, defaultUnit: "plate" },
      { exerciseName: "Low row", defaultSets: 3, defaultReps: 8, defaultWeight: 7.5, defaultUnit: "kg" },
      { exerciseName: "Spider curl", defaultSets: 3, defaultReps: 8, defaultWeight: 6, defaultUnit: "kg" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Firestore <-> domain mappers                                               */
/* -------------------------------------------------------------------------- */

function stripIds<T extends { id: string }>(o: T): Omit<T, "id"> {
  const { id: _id, ...rest } = o;
  return rest;
}

function toWorkout(id: string, raw: DocumentData): Workout {
  return {
    id,
    name: raw.name ?? "",
    date: raw.date ?? "",
    durationMin: raw.durationMin,
    exercises: raw.exercises ?? [],
    notes: raw.notes,
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt),
  };
}

function toTemplate(id: string, raw: DocumentData): Template {
  return {
    id,
    name: raw.name ?? "",
    items: raw.items ?? [],
    createdAt: toMillis(raw.createdAt),
    updatedAt: toMillis(raw.updatedAt),
  };
}

function toExercise(id: string, raw: DocumentData): Exercise {
  return {
    id,
    name: raw.name ?? "",
    defaultUnit: raw.defaultUnit ?? "kg",
    category: raw.category,
  };
}

function toMillis(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof (v as { toMillis?: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}
