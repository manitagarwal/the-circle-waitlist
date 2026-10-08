import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Notice, Screen, StepHeader, Title } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { INTERESTS_MAX, INTERESTS_MIN, toggleInterest } from '@/lib/profile';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { useSetup } from './_layout';

type Group = Awaited<ReturnType<typeof api.interestGroups>>[number];

export default function Interests() {
  const r = useRouter();
  const { s, set } = useSetup();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = () => { setErr(null); api.interestGroups().then(setGroups).catch((e) => setErr(friendly(e))); };
  useEffect(load, []);
  const n = s.interestIds.length;

  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/setup/about')} disabled={n < INTERESTS_MIN} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={2} of={4} />
      <Title italic>What are you into?</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Pick {INTERESTS_MIN} to {INTERESTS_MAX}. These channels come first.</Body>
      <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: n >= INTERESTS_MIN ? colors.sage : colors.muted, marginTop: 10 }}>{n} of {INTERESTS_MAX}</Text>
      {err ? <><Notice tone="error">{err}</Notice><Button label="Try again" variant="secondary" onPress={load} style={{ marginTop: 12 }} /></> : null}
      {!groups && !err ? <ActivityIndicator color={colors.goldText} style={{ marginTop: 32 }} /> : null}
      {groups?.map((g) => (
        <View key={g.id} style={{ marginTop: 20 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.titleMedium, fontSize: 17, color: colors.ink, marginBottom: 8 }}>{g.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {g.interests.map((i) => {
              const on = s.interestIds.includes(i.id);
              const full = !on && n >= INTERESTS_MAX;
              return (
                <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: full }} disabled={full}
                  onPress={() => set({ interestIds: toggleInterest(s.interestIds, i.id) })}
                  style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.control, borderWidth: 1, opacity: full ? 0.45 : 1,
                    borderColor: on ? colors.goldText : colors.line, backgroundColor: on ? colors.goldTint : colors.card }}>
                  <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 14, color: colors.ink }}>{i.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
