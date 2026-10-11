import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Icon } from './Icon';
import { Row, Sheet } from './lists';
import { Button } from './ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useCity } from '@/lib/city';

/** The city chip that opens the city list. Switching changes everything that belongs to a place. */
export function CityChip() {
  const city = useCity();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`City: ${city.name}. Change city`} onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.line }}>
        <Icon name="pin" size={16} color={colors.ink} />
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>{city.name}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>▾</Text>
      </Pressable>
      <CitySheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CitySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const city = useCity();
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [noted, setNoted] = useState<Record<number, boolean>>({});
  const pick = async (id: number) => {
    setBusy(id); setErr(null);
    try { await city.switchTo(id); onClose(); } catch (e) { setErr(friendly(e)); } finally { setBusy(null); }
  };
  const notify = async (id: number) => {
    setBusy(id); setErr(null);
    try { await api.notifyCity(id); setNoted((n) => ({ ...n, [id]: true })); } catch (e) { setErr(friendly(e)); } finally { setBusy(null); }
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose a city">
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginBottom: 6 }}>Bookings, channels, lobbies and people follow the city you pick. Your chats stay with you.</Text>
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
        {city.cities.map((c) => (
          <Row key={c.id} title={c.name} subtitle={c.is_live ? null : 'Coming soon'}
            right={c.id === city.id ? <Text style={{ color: colors.sage, fontFamily: fonts.bodySemi, fontSize: 18 }}>✓</Text>
              : c.is_live ? undefined
              : <Button label={noted[c.id] ? 'We’ll tell you' : 'Notify me'} variant="secondary" disabled={noted[c.id]} loading={busy === c.id} onPress={() => notify(c.id)} style={{ height: 38, paddingHorizontal: 14 }} />}
            onPress={c.id === city.id ? undefined : () => pick(c.id)} />
        ))}
      </ScrollView>
      {err ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 8 }}>{err}</Text> : null}
    </Sheet>
  );
}
