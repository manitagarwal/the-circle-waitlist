import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Bar } from '@/components/Bar';
import { Row } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useCity } from '@/lib/city';

export default function BasedIn() {
  const city = useCity();
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const home = city.home;
  const left = home?.changes_left ?? 0;
  const save = async () => {
    if (pick == null) return;
    setBusy(true); setErr(null);
    try { await api.changeHomeCity(pick); await city.reload(); setPick(null); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };
  const when = home?.next_change_at ? new Date(home.next_change_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Based in" />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 36, color: colors.ink }}>{home?.home_name ?? ''}</Text>
        <Body style={{ marginTop: 6 }}>This is the city others see on your profile. You can change it twice every 2 months{left < 2 ? `. You have ${left} ${left === 1 ? 'change' : 'changes'} left` : ''}{left === 0 && when ? `, and can change it again from ${when}` : ''}. To just look around another city, use the city button at the top of Home.</Body>
        <View style={{ marginTop: 16, opacity: left === 0 ? 0.5 : 1 }}>
          {city.cities.map((c) => (
            <Row key={c.id} title={c.name} subtitle={c.is_live ? null : 'Coming soon'}
              right={(pick ?? home?.home_id) === c.id ? <Text style={{ color: colors.sage, fontFamily: fonts.bodySemi, fontSize: 18 }}>✓</Text> : undefined}
              onPress={left === 0 ? undefined : () => setPick(c.id)} />
          ))}
        </View>
        {err ? <Notice tone="error">{err}</Notice> : null}
        {pick != null && pick !== home?.home_id ? <Button label="Save" onPress={save} loading={busy} style={{ marginTop: 20 }} /> : null}
      </ScrollView>
    </View>
  );
}
