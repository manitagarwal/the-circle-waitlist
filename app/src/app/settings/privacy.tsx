import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Bar } from '@/components/Bar';
import { Info } from '@/components/Info';
import { State } from '@/components/lists';
import { Notice } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { PRIVACY_FIELDS, type Privacy, type PrivacyKey } from '@/lib/privacy';
import { useLoad } from '@/lib/useLoad';

/** Switches for what other members can see on a profile. Everything is visible until it is switched off. */
export default function PrivacyScreen() {
  const { data, error, loading, reload, setData } = useLoad(() => api.myPrivacy());
  const [err, setErr] = useState<string | null>(null);

  const toggle = async (key: PrivacyKey, show: boolean) => {
    const prev = data ?? {};
    const next: Privacy = { ...prev, [key]: !show };
    setData(next); setErr(null);
    try { setData(await api.setPrivacy(next)); } catch (e) { setData(prev); setErr(friendly(e)); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="What others see" />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48 }}>
        <State loading={loading} error={error} onRetry={reload} />
        {data ? (<>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.8, color: colors.faint }}>ALWAYS VISIBLE: PHOTO, NAME, USERNAME</Text>
            <Info text="Everyone needs to know who they are talking to, so your photo, name and username can't be hidden. Everything else is up to you. Your reliability score is never shown to anyone." title="Always visible" size={18} style={{ marginTop: 0 }} />
          </View>
          <View style={{ marginTop: 8 }}>
            {PRIVACY_FIELDS.map((f) => {
              const shown = !data[f.key];
              return (
                <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 68, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>{f.label}</Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 }}>{shown ? 'Visible to members' : 'Hidden'}</Text>
                  </View>
                  <Switch accessibilityLabel={`Show ${f.label}`} value={shown} onValueChange={(v) => toggle(f.key, v)} trackColor={{ true: colors.ink, false: colors.lineStrong }} thumbColor={colors.ground} />
                </View>
              );
            })}
          </View>
          {err ? <Notice tone="error">{err}</Notice> : null}
        </>) : null}
      </ScrollView>
    </View>
  );
}
