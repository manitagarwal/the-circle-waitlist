import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { GrowBar } from '@/components/motion';
import { PageHeader } from '@/components/lists';
import { Screen } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { calcScore, EXAMPLES, rulesFrom, type ScoreRules } from '@/lib/score';
import { useLoad } from '@/lib/useLoad';

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 34 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink, marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}
const Line = ({ k, v }: { k: string; v: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }}>
    <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{k}</Text>
    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{v}</Text>
  </View>
);
const Para = ({ children }: { children: React.ReactNode }) => <Text style={{ fontFamily: fonts.body, fontSize: 15.5, lineHeight: 23, color: colors.muted, marginBottom: 10 }}>{children}</Text>;

export default function Reliability() {
  const { data } = useLoad(async () => {
    const [score, raw] = await Promise.all([api.myScore().catch(() => null), api.scoreRules().catch(() => null)]);
    return { score, rules: rulesFrom(raw) };
  });
  const rules: ScoreRules = data?.rules ?? rulesFrom(null);
  const examples = useMemo(() => EXAMPLES.map((x) => ({ ...x, score: calcScore(x.events, x.signIns ?? [], rules) })), [rules]);
  const w = rules.weights;
  const days = (n: number) => `${n} days`;
  return (
    <Screen>
      <PageHeader title="Reliability" />
      {data?.score != null ? (
        <View style={{ marginTop: 14, padding: 18, backgroundColor: colors.surface, borderRadius: radius.card }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.8, color: colors.faint }}>YOUR SCORE, PRIVATE TO YOU</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 48, color: colors.ink, marginTop: 4 }}>{Number(data.score).toFixed(1)}<Text style={{ fontSize: 22, color: colors.muted }}> / 10</Text></Text>
          <View style={{ marginTop: 8 }}><GrowBar pct={Number(data.score) * 10} color={colors.ink} track={colors.lineStrong} /></View>
        </View>
      ) : null}

      <Block title="What it is">
        <Para>Reliability is a number from 0 to 10 that says how much the community can count on you. Hosts use it to decide who joins, and some bookings and events ask for a minimum. Only you see your own number.</Para>
        <Para>Everyone starts at {rules.newMember}. It moves a little with what you do, and it moves slowly, so one bad day does not define you.</Para>
      </Block>

      <Block title="What moves it">
        <Line k="Show up to a booking or event" v={signed(w.attended)} />
        <Line k="Host a booking that goes ahead" v={signed(w.hosted)} />
        <Line k="Open the app on a day" v={`${signed(rules.signInWeight)}, at most ${rules.signInCap} in all`} />
        <Line k="Cancel in good time" v={signed(w.early_cancel)} />
        <Line k="Cancel late" v={signed(w.late_cancel)} />
        <Line k="No-show" v={signed(w.no_show)} />
        <Line k="Host cancels late" v={signed(w.host_late_cancel)} />
        <Line k="Host does not show up" v={signed(w.host_no_show)} />
        <Line k="A report the team upholds" v={`${signed(w.report_minor)} to ${signed(w.report_severe)}`} />
      </Block>

      <Block title="How fairly it is worked out">
        <Para>Old things fade. An event counts for half as much after {days(rules.halfLife)}, and half again after another {days(rules.halfLife)}. Recent behaviour matters most.</Para>
        <Para>The first slip is softened. The first no-show or late cancel in {days(rules.graceWindow)} counts for {Math.round(rules.graceFactor * 100)}%. A second one inside that time counts in full.</Para>
        <Para>A good record cushions a slip. Each good event in the {days(rules.graceWindow)} before it makes the penalty smaller. After ten good events a no-show costs about a third of what it costs someone new.</Para>
        <Para>Hosts are held to a higher standard. When you host, people plan around you, so a host who cancels late or does not show gets no discount and no cushion.</Para>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 21, color: colors.ink, marginTop: 6 }}>Score = 10 × (good points + {rules.priorWeight * rules.newMember / 10}) ÷ (good points + penalty points + {rules.priorWeight})</Text>
      </Block>

      <Block title="Examples">
        {examples.map((x) => (
          <View key={x.title} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>{x.title}</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 3 }}>{x.story}</Text>
            </View>
            <Text accessibilityLabel={`Score ${x.score.toFixed(1)}`} style={{ fontFamily: fonts.display, fontSize: 32, color: colors.ink }}>{x.score.toFixed(1)}</Text>
          </View>
        ))}
      </Block>
    </Screen>
  );
}
