"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase config loaded:', {
  apiKey: !!cfg.apiKey,
  authDomain: !!cfg.authDomain,
  projectId: !!cfg.projectId,
  storageBucket: !!cfg.storageBucket,
  messagingSenderId: !!cfg.messagingSenderId,
  appId: !!cfg.appId,
});
export const firebaseConfigured = Boolean(cfg.apiKey && cfg.projectId);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getAppSafe(): FirebaseApp | null {
  if (!firebaseConfigured) return null;
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(cfg as Record<string, string>);
  return _app;
}

export function getFirebaseAuth(): Auth | null {
  if (!firebaseConfigured) return null;
  if (_auth) return _auth;
  const app = getAppSafe();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

export function getDb(): Firestore | null {
  if (!firebaseConfigured) return null;
  if (_db) return _db;
  const app = getAppSafe();
  if (!app) return null;
  // Use persistent cache so data is available offline across reloads/tabs.
  // This must be passed at initialization (cannot be added later).
  try {
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Fall back to in-memory cache if persistence cannot be initialized
    // (e.g. SSR, unsupported browser, already initialized).
    _db = null;
    // Lazy import to avoid bundling the regular path in case of issues
    import("firebase/firestore").then(({ getFirestore }) => {
      _db = getFirestore(app);
    });
  }
  return _db;
}
