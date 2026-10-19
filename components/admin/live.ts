"use client";

// Client-side state that survives navigation inside the back office (module scope = one per tab):
// - pending saves shown in a list before the server confirms them (optimistic rows)
// - toasts
import { useSyncExternalStore } from "react";

export type PendingRow = { key: string; entity: string; year: number; title: string; failed?: boolean };
export type Toast = { key: string; tone: "ok" | "error" | "info"; text: string; action?: { label: string; href: string } };

function store<T>(initial: T[]) {
  let items = initial;
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((s) => s());
  return {
    get: () => items,
    set: (next: T[]) => { items = next; emit(); },
    subscribe: (s: () => void) => { subs.add(s); return () => subs.delete(s); },
  };
}

const pending = store<PendingRow>([]);
const toasts = store<Toast>([]);
const EMPTY: never[] = [];

export const addPending = (r: PendingRow) => pending.set([r, ...pending.get()]);
export const removePending = (key: string) => pending.set(pending.get().filter((r) => r.key !== key));
export const usePending = (entity: string, year: number) =>
  useSyncExternalStore(pending.subscribe, pending.get, () => EMPTY).filter((r) => r.entity === entity && r.year === year);

export function toast(t: Omit<Toast, "key">, ms = 4500) {
  const key = crypto.randomUUID();
  toasts.set([...toasts.get(), { ...t, key }]);
  if (ms) setTimeout(() => dismiss(key), ms);
  return key;
}
export const dismiss = (key: string) => toasts.set(toasts.get().filter((t) => t.key !== key));
export const useToasts = () => useSyncExternalStore(toasts.subscribe, toasts.get, () => EMPTY);
