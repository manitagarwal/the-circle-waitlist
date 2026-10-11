import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

/** How lively the app feels. Calm: no buzzes, no entrance animations. Playful: the default. Full: everything, a bit longer. */
export type Playfulness = 'calm' | 'playful' | 'full';
const KEY = 'playfulness';
let level: Playfulness = 'playful';
const listeners = new Set<(l: Playfulness) => void>();

export const getPlayfulness = () => level;
export function setPlayfulness(l: Playfulness) {
  level = l;
  listeners.forEach((fn) => fn(l));
  void SecureStore.setItemAsync(KEY, l).catch(() => {});
}
void SecureStore.getItemAsync(KEY).then((v) => { if (v === 'calm' || v === 'playful' || v === 'full') { level = v; listeners.forEach((fn) => fn(v)); } }).catch(() => {});

export function usePlayfulness(): Playfulness {
  const [l, setL] = useState(level);
  useEffect(() => { listeners.add(setL); setL(level); return () => { listeners.delete(setL); }; }, []);
  return l;
}
