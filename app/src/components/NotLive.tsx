import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Screen } from './ui';
import { TabHeader } from './lists';
import { CitySheet } from './CitySheet';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { useCity } from '@/lib/city';

/** Shown in place of a tab when the chosen city is not open yet. */
export function NotLive() {
  const city = useCity();
  const [open, setOpen] = useState(false);
  const [noted, setNoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const notify = async () => {
    setBusy(true);
    try { await api.notifyCity(city.id); setNoted(true); } catch { /* try again later */ } finally { setBusy(false); }
  };
  return (
    <Screen>
      <TabHeader title="Soon." />
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontFamily: fonts.title, fontSize: 24, lineHeight: 30, color: colors.ink }}>We're not live in {city.name} yet.</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.muted, marginTop: 10 }}>
          The Semi Circle starts in Delhi NCR, and we're opening new cities one at a time. Please wait while we come to you. We'll email you the day it opens.
        </Text>
        <Button label={noted ? "We'll email you" : 'Tell me when it opens'} onPress={notify} disabled={noted} loading={busy} style={{ marginTop: 24 }} />
        <Button label="Change city" variant="secondary" onPress={() => setOpen(true)} style={{ marginTop: 12 }} />
      </View>
      <CitySheet visible={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}
