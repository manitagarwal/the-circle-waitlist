import React, { useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Body, Button, Notice, Screen, StepHeader, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { NOTIFICATION_SWITCHES, parseDob, profileArgs } from '@/lib/profile';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useSetup } from './_layout';
import { Info } from '@/components/Info';

export default function NotificationsStep() {
  const r = useRouter();
  const { s } = useSetup();
  const { session, refresh } = useAuth();
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(NOTIFICATION_SWITCHES.map((x) => [x.key, true])));
  const [busy, setBusy] = useState<'' | 'allow' | 'skip'>('');
  const [err, setErr] = useState<string | null>(null);

  /** Saves the whole profile, then (optionally) the notification choices. Routing moves on once the profile is complete. */
  const finish = async (allow: boolean) => {
    if (busy || !session) return;
    setBusy(allow ? 'allow' : 'skip'); setErr(null);
    try {
      let photoPath: string | null = null;
      if (s.photoUri) photoPath = await api.uploadProfilePhoto(session.user.id, await (await fetch(s.photoUri)).arrayBuffer());
      await api.completeProfile(profileArgs({
        avatarId: s.avatarId, photoPath, interestIds: s.interestIds, dob: parseDob(s.dobD, s.dobM, s.dobY)!, gender: s.gender,
        address: s.address, area: s.area, lat: s.lat, lng: s.lng, field: s.field,
      }));
      if (allow) {
        for (const sw of NOTIFICATION_SWITCHES) for (const c of sw.categories) await api.setNotificationPref(c, on[sw.key]);
        await askForPush();
      }
      await refresh();
    } catch (e) { setErr(friendly(e)); setBusy(''); }
  };

  return (
    <Screen footer={<View style={{ gap: 4 }}>
      <Button label="Allow notifications" onPress={() => finish(true)} loading={busy === 'allow'} disabled={!!busy} />
      <Button label="Not now" variant="link" onPress={() => finish(false)} loading={busy === 'skip'} disabled={!!busy} />
    </View>}>
      <StepHeader step={4} of={4} />
      <Title italic>Want a nudge?</Title>
      <Info text={"We only buzz you for things that need you."} />
      <View style={{ marginTop: 20, backgroundColor: colors.surface, borderRadius: radius.card }}>
        {NOTIFICATION_SWITCHES.map((sw, i) => (
          <View key={sw.key} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
            <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink, paddingRight: 12 }}>{sw.label}</Text>
            <Switch accessibilityLabel={sw.label} value={on[sw.key]} onValueChange={(v) => setOn((o) => ({ ...o, [sw.key]: v }))}
              trackColor={{ true: colors.ink, false: colors.lineStrong }} thumbColor={colors.ground} />
          </View>
        ))}
      </View>
      <Info text={"Switch any of these off later in Settings."} />
      {err ? <Notice tone="error">{err}</Notice> : null}
    </Screen>
  );

  /** Asks the phone for permission and registers its push token. Never blocks finishing the profile. */
  async function askForPush() {
    if (Platform.OS === 'web') return;
    try {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) return;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
      await api.registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
    } catch { /* phone alerts are not switched on yet; the choices above are saved either way */ }
  }
}
