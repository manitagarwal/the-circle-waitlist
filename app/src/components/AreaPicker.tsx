import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Icon } from './Icon';
import { Row, Sheet } from './lists';
import { TextField } from './ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import type { Area } from '@/lib/api';
import { useCity } from '@/lib/city';
import { matchAreas } from '@/lib/areas';

const cache = new Map<number, Promise<Area[]>>();
const load = (cityId: number) => {
  if (!cache.has(cityId)) cache.set(cityId, api.areas(cityId).catch((e) => { cache.delete(cityId); throw e; }));
  return cache.get(cityId)!;
};

/** An area field: search the city's areas, or type your own. */
export function AreaPicker({ label = 'Area', value, onChange, hint }: { label?: string; value: string; onChange: (v: string) => void; hint?: string }) {
  const city = useCity();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [areas, setAreas] = useState<Area[]>([]);
  useEffect(() => { void load(city.id).then(setAreas).catch(() => setAreas([])); }, [city.id]);
  const shown = useMemo(() => matchAreas(areas, q, 40), [areas, q]);
  const typed = q.trim();
  const exact = shown.some((a) => a.name.toLowerCase() === typed.toLowerCase());
  const choose = (v: string) => { onChange(v); setOpen(false); setQ(''); };
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value || 'not chosen'}. Change`} onPress={() => setOpen(true)}
        style={{ minHeight: 52, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, color: value ? colors.ink : colors.faint }}>{value || `Search ${city.name} areas`}</Text>
        <Icon name="search" size={18} color={colors.faint} />
      </Pressable>
      {hint ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6 }}>{hint}</Text> : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={`${city.name} areas`}>
        <TextField label="Search" value={q} onChangeText={setQ} placeholder="For example: sector 56, vasant kunj" autoCapitalize="none" autoFocus />
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 12 }}>
          {typed.length >= 2 && !exact ? <Row title={`Use "${typed}"`} subtitle="Type your own area" onPress={() => choose(typed)} /> : null}
          {shown.map((a) => <Row key={a.id} title={a.name} onPress={() => choose(a.name)} />)}
          {shown.length === 0 && typed.length < 2 ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, paddingVertical: 12 }}>Start typing to search, or type your own area.</Text> : null}
        </ScrollView>
      </Sheet>
    </View>
  );
}
