'use client';
// Network failure (fetch rejects) → offline; any HTTP response (even 4xx) → online.
import React from 'react';

let online = true;
let checked = false; // becomes true after the first request resolves/rejects
const subs = new Set<() => void>();

function emit() {
  subs.forEach((fn) => fn());
}

export function setServerOnline(value: boolean): void {
  const changed = online !== value || !checked;
  checked = true;
  online = value;
  if (changed) emit();
}

export function getServerOnline(): boolean {
  return online;
}

/** React hook: re-renders when the server reachability changes. */
export function useServerOnline(): boolean {
  return React.useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => online,
    () => true, // SSR: assume online so the banner never flashes on the server render
  );
}
