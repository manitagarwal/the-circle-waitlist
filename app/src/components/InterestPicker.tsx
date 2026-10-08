import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Collapsible } from './Collapsible';
import { Notice } from './ui';
import { Button } from './ui';
import { colors, fonts, radius } from '@/theme';
import { INTERESTS_MAX, INTERESTS_MIN, toggleInterest } from '@/lib/profile';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { loadInterestGroups } from '@/lib/interests';

type Group = Awaited<ReturnType<typeof api.interestGroups>>[number];

/** Grouped interest chips with the 3 to 5 rule. */
export function InterestPicker({ selected, onChange }: { selected: number[]; onChange: (ids: number[]) => void }) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = () => { setErr(null); loadInterestGroups(() => api.interestGroups()).then(setGroups).catch((e) => setErr(friendly(e))); };
  useEffect(load, []);
  const n = selected.length;
  return (
    <View>
      <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: n >= INTERESTS_MIN ? colors.sage : colors.muted, marginTop: 10 }}>{n} of {INTERESTS_MAX}</Text>
      {err ? <><Notice tone="error">{err}</Notice><Button label="Try again" variant="secondary" onPress={load} style={{ marginTop: 12 }} /></> : null}
      {!groups && !err ? <ActivityIndicator color={colors.goldText} style={{ marginTop: 32 }} /> : null}
      {groups?.map((g) => (
        <Collapsible key={g.id} title={g.name} count={g.interests.length} selected={g.interests.filter((i) => selected.includes(i.id)).length} defaultOpen={g.interests.some((i) => selected.includes(i.id))}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 6 }}>
            {g.interests.map((i) => {
              const on = selected.includes(i.id);
              const full = !on && n >= INTERESTS_MAX;
              return (
                <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: full }} disabled={full} onPress={() => onChange(toggleInterest(selected, i.id))}
                  style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.control, borderWidth: 1, opacity: full ? 0.45 : 1, borderColor: on ? colors.goldText : colors.line, backgroundColor: on ? colors.goldTint : colors.card }}>
                  <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 14, color: colors.ink }}>{i.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </Collapsible>
      ))}
    </View>
  );
}
