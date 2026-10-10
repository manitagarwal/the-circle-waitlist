import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Icon } from './Icon';
import { Info } from './Info';
import { useUnread } from '@/lib/unread';
import { activityIcon } from '@/lib/activityIcons';
import { colors, fonts, isDark, radius } from '@/theme';
import { toneFor } from '@/lib/tones';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button } from './ui';
import { ChipRow } from './ChipRow';
import { FadeUp, PressScale, useReduceMotion } from './motion';

/** A small round count for an icon: the number of unread things, or nothing when there are none. */
export function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <View accessibilityLabel={`${n} unread`} style={{ position: 'absolute', top: -3, right: -3, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.inkOn }}>{n > 99 ? '99+' : n}</Text>
    </View>
  );
}

/** The top of a main screen: the name and quick actions (find people, messages, activity), then a large heading. */
export function TabHeader({ title, right, info }: { title: string; right?: React.ReactNode; info?: string }) {
  const r = useRouter();
  const unread = useUnread();
  const round = { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Svg width={22} height={12} viewBox="0 0 22 12"><Path d="M1 12A10 10 0 0 1 21 12z" fill={colors.ink} /></Svg>
          <Text style={{ fontFamily: fonts.title, fontSize: 16, color: colors.ink }}>The Semi Circle</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PressScale accessibilityRole="button" accessibilityLabel="Find people" onPress={() => r.push('/people')} style={round}><Icon name="search" size={20} /></PressScale>
          <PressScale accessibilityRole="button" accessibilityLabel={unread.messages ? `Messages, ${unread.messages} unread` : 'Messages'} onPress={() => r.push('/messages')} style={round}>
            <Icon name="messages" size={20} /><CountBadge n={unread.messages} />
          </PressScale>
          <PressScale accessibilityRole="button" accessibilityLabel={unread.activity ? `Activity, ${unread.activity} unread` : 'Activity'} onPress={() => r.push('/activity')} style={round}>
            <Icon name="activity" size={20} /><CountBadge n={unread.activity} />
          </PressScale>
        </View>
      </View>
      <View style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 42, lineHeight: 48, letterSpacing: -1, color: colors.ink }}>{title}</Text>
          {info ? <Info text={info} title={title} style={{ marginTop: 10 }} /> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

/** The top of a screen you open from a main one: a back button, then the heading. The bottom bar is hidden here. */
export function PageHeader({ title, right, info }: { title: string; right?: React.ReactNode; info?: string }) {
  return (
    <View>
      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton />
        {right}
      </View>
      <View style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 42, lineHeight: 48, letterSpacing: -1, color: colors.ink }}>{title}</Text>
        {info ? <Info text={info} title={title} style={{ marginTop: 10 }} /> : null}
      </View>
    </View>
  );
}

/** Text tabs with an underline that springs from one to the next. */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const reduce = useReduceMotion();
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const [lay, setLay] = useState<{ x: number; w: number }[]>([]);
  const x = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = lay[idx];
    if (!t) return;
    if (reduce) { x.setValue(t.x); w.setValue(t.w); return; }
    Animated.parallel([
      Animated.spring(x, { toValue: t.x, speed: 16, bounciness: 10, useNativeDriver: false }),
      Animated.spring(w, { toValue: t.w, speed: 16, bounciness: 6, useNativeDriver: false }),
    ]).start();
  }, [idx, lay, reduce, x, w]);
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 26, borderBottomWidth: 1, borderBottomColor: colors.line, marginTop: 6, marginBottom: 6 }}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            onLayout={(e) => { const { x: lx, width } = e.nativeEvent.layout; setLay((l) => { const n = [...l]; n[i] = { x: lx, w: width }; return n; }); }}
            style={{ paddingVertical: 12 }}>
            <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.bodyMedium, fontSize: 15, color: on ? colors.ink : colors.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', bottom: -1, height: 2, backgroundColor: colors.ink, left: x, width: w }} />
    </View>
  );
}

export const SectionLabel = ({ children, info }: { children: React.ReactNode; info?: string }) => (
  <View style={{ marginTop: 36, marginBottom: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 2, textTransform: 'uppercase', color: colors.goldText }}>{children}</Text>
    {info ? <Info text={info} title={typeof children === 'string' ? children : undefined} size={20} style={{ marginTop: 0 }} /> : null}
  </View>
);

/** The circle behind an activity's clipart. Without an activity it shows the first letter. */
export function LetterBadge({ name, size = 56, activity }: { name: string; size?: number; activity?: string | null }) {
  const icon = activityIcon(activity);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: toneFor(activity, isDark) ?? colors.plate, alignItems: 'center', justifyContent: 'center' }}>
      {icon ? <SvgXml xml={icon} width={size * 0.58} height={size * 0.58} color={colors.ink} /> : <Text style={{ fontFamily: fonts.title, fontSize: size * 0.42, color: colors.ink }}>{(name[0] ?? '?').toUpperCase()}</Text>}
    </View>
  );
}
export const ArchBadge = ({ name, size = 60, activity }: { name: string; size?: number; activity?: string | null }) => <LetterBadge name={name} size={size} activity={activity} />;

/** The same circle with a small dot on the corner when something is new. */
export function RingBadge({ name, unread, size = 60, activity }: { name: string; unread?: boolean; size?: number; activity?: string | null }) {
  return (
    <View style={{ width: size, height: size }}>
      <LetterBadge name={name} size={size} activity={activity} />
      {unread ? <View accessibilityLabel="New messages" style={{ position: 'absolute', top: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ground }} /> : null}
    </View>
  );
}

/** Puts a small dot on the corner of whatever it wraps when there is something new. */
export function WithDot({ on, children }: { on?: boolean; children: React.ReactNode }) {
  return (
    <View>
      {children}
      {on ? <View accessibilityLabel="New messages" style={{ position: 'absolute', top: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ground }} /> : null}
    </View>
  );
}

export function Row({ left, title, subtitle, meta, right, onPress, tag, unread }: {
  left?: React.ReactNode; title: string; subtitle?: string | null; meta?: string | null; right?: React.ReactNode; onPress?: () => void; tag?: string | null; unread?: number;
}) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 16, minHeight: 84 }}>
      {left}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: unread ? fonts.bodySemi : fonts.bodySemi, fontSize: 16, color: colors.ink }}>{title}</Text>
          {meta ? <Text style={{ fontFamily: unread ? fonts.bodySemi : fonts.body, fontSize: 12.5, color: unread ? colors.ink : colors.faint }}>{meta}</Text> : null}
        </View>
        {subtitle ? <Text numberOfLines={2} style={{ fontFamily: unread ? fonts.bodyMedium : fonts.body, fontSize: 14, color: unread ? colors.ink : colors.muted, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {unread ? <View accessibilityLabel={`${unread} unread`} style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.inkOn }}>{unread > 99 ? '99+' : unread}</Text></View> : null}
      {right}
    </View>
  );
  return (
    <FadeUp distance={8}>
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, borderBottomWidth: 1, borderBottomColor: colors.line })}>{body}</Pressable>
      ) : <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>{body}</View>}
    </FadeUp>
  );
}

export function Chip({ label, on, onPress, dot }: { label: string; on?: boolean; onPress: () => void; dot?: string | null }) {
  return (
    <PressScale accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress}
      style={{ height: 38, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 19, borderWidth: 1, borderColor: on ? colors.ink : colors.line, backgroundColor: on ? colors.ink : 'transparent', marginRight: 8 }}>
      {dot ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot, borderWidth: 1, borderColor: on ? colors.inkOn : colors.lineStrong }} /> : null}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: on ? colors.inkOn : colors.ink }}>{label}</Text>
    </PressScale>
  );
}

export function State({ loading, error, empty, onRetry }: { loading?: boolean; error?: string | null; empty?: string | null; onRetry?: () => void }) {
  if (loading) return <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />;
  if (error) return (
    <View style={{ marginTop: 32, alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.error, textAlign: 'center' }}>{error}</Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
  if (empty) return <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 12 }}>{empty}</Text>;
  return null;
}

/** A bottom sheet that slides up over a dimmed background. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(10,9,8,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable accessible={false} style={{ backgroundColor: colors.ground, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingTop: 12, paddingBottom: insets.bottom + 20, maxHeight: '82%' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: 14 }} />
          {title ? <Text accessibilityRole="header" style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink, marginBottom: 8 }}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type FilterDef = { key: string; label: string; options: string[] };

/** A row of filter chips; each opens a sheet to pick one option or "Any". */
export function FilterBar({ defs, values, onChange }: { defs: FilterDef[]; values: Record<string, string | undefined>; onChange: (key: string, value: string | undefined) => void }) {
  const [open, setOpen] = React.useState<string | null>(null);
  const def = defs.find((d) => d.key === open);
  return (
    <>
      <View style={{ marginVertical: 8 }}>
        <ChipRow>{defs.map((d) => <Chip key={d.key} label={values[d.key] ? `${d.label}: ${values[d.key]}` : d.label} on={!!values[d.key]} onPress={() => setOpen(d.key)} />)}</ChipRow>
      </View>
      <Sheet visible={!!def} onClose={() => setOpen(null)} title={def?.label}>
        <ScrollView>
          <Row title="Any" onPress={() => { onChange(open!, undefined); setOpen(null); }} />
          {def?.options.map((o) => <Row key={o} title={o} onPress={() => { onChange(open!, o); setOpen(null); }} right={values[open!] === o ? <Text style={{ color: colors.sage, fontFamily: fonts.bodySemi }}>✓</Text> : undefined} />)}
          {def && def.options.length === 0 ? <State empty="No options yet." /> : null}
        </ScrollView>
      </Sheet>
    </>
  );
}

/** A thin rule with the day in small capitals, between chat messages from different days. */
export function DayDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.faint }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
    </View>
  );
}
