import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, useAuth } from '@/lib/auth';
import type { City, MyCity } from '@/lib/api';

type Ctx = {
  /** The city you are looking at right now. Everything place-based follows it. */
  id: number; name: string; live: boolean;
  home: MyCity | null;
  cities: City[];
  /** Bumps on every switch, so screens can start fresh. */
  epoch: number;
  ready: boolean;
  switchTo: (id: number) => Promise<void>;
  reload: () => Promise<void>;
};
const Fallback: Ctx = { id: 1, name: 'Delhi NCR', live: true, home: null, cities: [], epoch: 0, ready: false, switchTo: async () => {}, reload: async () => {} };
const C = createContext<Ctx>(Fallback);
export const useCity = () => useContext(C);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const { member } = useAuth();
  const memberId = member?.id;
  const [my, setMy] = useState<MyCity | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [epoch, setEpoch] = useState(0);
  const [ready, setReady] = useState(false);
  const reload = useCallback(async () => {
    const [m, c] = await Promise.all([api.myCity().catch(() => null), api.cities().catch(() => [] as City[])]);
    setMy(m); setCities(c); setReady(true);
  }, []);
  useEffect(() => { if (memberId) void reload(); else { setMy(null); setReady(false); } }, [memberId, reload]);
  const switchTo = useCallback(async (id: number) => {
    await api.setCurrentCity(id);
    await reload();
    setEpoch((e) => e + 1);
  }, [reload]);
  const value = useMemo<Ctx>(() => ({
    id: my?.current_id ?? 1, name: my?.current_name ?? 'Delhi NCR', live: my ? my.current_live : true,
    home: my, cities, epoch, ready, switchTo, reload,
  }), [my, cities, epoch, ready, switchTo, reload]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
