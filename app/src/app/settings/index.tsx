import React, { useState } from 'react';
import { Linking, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { Icon } from '@/components/Icon';
import { Row, SectionLabel, State } from '@/components/lists';
import { Body } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { SITE_URL } from '@/lib/config';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { NOTIFICATION_SWITCHES } from '@/lib/profile';
import { useLoad } from '@/lib/useLoad';
import { Info } from '@/components/Info';

const Chev = () => <Icon name="chevron" size={18} color={colors.faint} />;

export default function Settings() {
  const r = useRouter();
  const { signOut } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const { data, error, loading, reload, setData } = useLoad(async () => {
    const [prefs, own, blocked] = await Promise.all([api.notificationPrefs(), api.ownRow(), api.blocked().catch(() => [])]);
    return { prefs, interests: own.interestIds.length, blocked: blocked.length };
  });

  const toggle = async (cats: readonly string[], v: boolean) => {
    if (!data) return;
    const before = data;
    setData({ ...data, prefs: { ...data.prefs, ...Object.fromEntries(cats.map((c) => [c, v])) } });
    try { for (const c of cats) await api.setNotificationPref(c, v); setErr(null); } catch (e) { setData(before); setErr(friendly(e)); }
  };
  const isOn = (cats: readonly string[]) => cats.every((c) => data?.prefs[c] !== false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <State loading={loading} error={error} onRetry={reload} />
        {data ? (<>
          <SectionLabel>Account</SectionLabel>
          <Row title="Photo, bio and username" right={<Chev />} onPress={() => r.push('/settings/profile')} />
          <Row title="Interests" meta={`${data.interests} of 5`} right={<Chev />} onPress={() => r.push('/settings/interests')} />
          <Row title="Password" right={<Chev />} onPress={() => r.push('/settings/password')} />

          <SectionLabel>Privacy</SectionLabel>
          <Row title="Blocked members" meta={String(data.blocked)} right={<Chev />} onPress={() => r.push('/settings/blocked')} />
          <Info text={"Profiles aren't private here. Every member sees every profile. That's what keeps this room honest."} />

          <SectionLabel>Notifications</SectionLabel>
          {NOTIFICATION_SWITCHES.map((sw) => (
            <View key={sw.key} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingRight: 12 }}>{sw.label}</Text>
              <Switch accessibilityLabel={sw.label} value={isOn(sw.categories)} onValueChange={(v) => toggle(sw.categories, v)} trackColor={{ true: colors.ink, false: colors.lineStrong }} thumbColor="#ffffff" />
            </View>))}
          {err ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 8 }}>{err}</Text> : null}
          <Info text={"Notices about your account, like a warning, always come through."} />

          <SectionLabel>More</SectionLabel>
          <Row title="Community guidelines" right={<Chev />} onPress={() => r.push('/settings/guidelines')} />
          <Row title="Terms of use" right={<Chev />} onPress={() => void Linking.openURL(`${SITE_URL}/terms/`)} />
          <Row title="Privacy policy" right={<Chev />} onPress={() => void Linking.openURL(`${SITE_URL}/privacy/`)} />
          <Row title="Your data and account" right={<Chev />} onPress={() => r.push('/settings/account')} />
          <Row title="Sign out" onPress={signOut} />
        </>) : null}
      </ScrollView>
    </View>
  );
}
