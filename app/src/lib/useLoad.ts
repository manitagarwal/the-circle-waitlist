import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { friendly } from './messages';

/** Loads data when the screen is shown (and again each time it regains focus). */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(async (pull = false) => {
    pull ? setRefreshing(true) : null;
    try { setData(await fnRef.current()); setError(null); } catch (e) { setError(friendly(e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { void run(); }, [run, ...deps]));
  return { data, error, loading, refreshing, reload: () => run(), pull: () => run(true), setData };
}
