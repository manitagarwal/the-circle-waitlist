import React, { createContext, useContext, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import * as Crypto from 'expo-crypto';
import type { Vouch } from '@/lib/api';
import { colors } from '@/theme';

export type ApplyState = {
  id: string; fullName: string; phone: string; city: string; cityOther: string; personalEmail: string; linkedin: string;
  workEmail: string; verified: boolean; referredByCode: string; vouches: Vouch[];
};
type Ctx = { s: ApplyState; set: (p: Partial<ApplyState>) => void };
const C = createContext<Ctx>(null as never);
export const cityValue = (s: ApplyState) => (s.city === 'Other' ? s.cityOther.trim() : s.city);
export const useApply = () => useContext(C);

export default function ApplyLayout() {
  const [s, setS] = useState<ApplyState>(() => ({
    id: Crypto.randomUUID(), fullName: '', phone: '', city: '', cityOther: '', personalEmail: '', linkedin: '',
    workEmail: '', verified: false, referredByCode: '', vouches: [],
  }));
  const v = useMemo(() => ({ s, set: (p: Partial<ApplyState>) => setS((o) => ({ ...o, ...p })) }), [s]);
  return (
    <C.Provider value={v}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground }, animation: 'fade' }} />
    </C.Provider>
  );
}
