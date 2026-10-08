import React, { createContext, useContext, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme';

export type SetupState = {
  avatarId: number | null; photoUri: string | null; interestIds: number[];
  dobD: string; dobM: string; dobY: string; gender: string; address: string; area: string;
  lat: number | null; lng: number | null; field: string;
};
type Ctx = { s: SetupState; set: (p: Partial<SetupState>) => void };
const C = createContext<Ctx>(null as never);
export const useSetup = () => useContext(C);

export default function SetupLayout() {
  const [s, setS] = useState<SetupState>({
    avatarId: null, photoUri: null, interestIds: [], dobD: '', dobM: '', dobY: '', gender: '', address: '', area: '', lat: null, lng: null, field: '',
  });
  const v = useMemo(() => ({ s, set: (p: Partial<SetupState>) => setS((o) => ({ ...o, ...p })) }), [s]);
  return (
    <C.Provider value={v}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground }, animation: 'fade' }} />
    </C.Provider>
  );
}
