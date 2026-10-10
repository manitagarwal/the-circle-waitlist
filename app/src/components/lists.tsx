import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { activityIcon } from '@/lib/activityIcons';
import { colors, fonts, radius } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './ui';
import { ChipRow } from './ChipRow';
import { useReduceMotion } from './motion';

export function TabHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: colors.ink }}>{title}</Text>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const reduce = useReduceMotion();
  const [w, setW] = useState(0);
  const n = options.length;
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useRef(new Animated.Value(idx)).current;
  useEffect(() => {
    if (reduce) { x.setValue(idx); return; }
    Animated.timing(x, { toValue: idx, duration: 380, easing: Easing.bezier(0.3, 0.8, 0.3, 1), useNativeDriver: true }).start();
  }, [idx, reduce, x]);
  const seg = w / n;
  return (
    <View accessibilityRole="tablist" onLayout={(e) => setW(e.nativeEvent.layout.width - 8)}
      style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 24, padding: 4, height: 48, marginVertical: 8 }}>
      {w > 0 ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 4, left: 4, width: seg, height: 40, borderRadius: 20, backgroundColor: colors.ink,
        transform: [{ translateX: x.interpolate({ inputRange: [0, Math.max(1, n - 1)], outputRange: [0, seg * Math.max(1, n - 1)] }) }] }} /> : null}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: on ? '#ffffff' : colors.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text accessibilityRole="header" style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.faint, marginTop: 24, marginBottom: 8 }}>{children}</Text>
);

/** A round badge with the first letter, used for channels. */
export function LetterBadge({ name, size = 44, activity }: { name: string; size?: number; activity?: string | null }) {
  const icon = activityIcon(activity);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      {icon ? <SvgXml xml={icon} width={size * 0.64} height={size * 0.64} /> : <Text style={{ fontFamily: fonts.display, fontSize: size * 0.43, color: colors.ink }}>{(name[0] ?? '?').toUpperCase()}</Text>}
    </View>
  );
}

/** The signature shape: a half-circle top on a flat base. */
export function ArchBadge({ name, size = 52, activity }: { name: string; size?: number; activity?: string | null }) {
  const icon = activityIcon(activity);
  return (
    <View style={{ width: size, height: size, borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2, backgroundColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
      {icon ? <SvgXml xml={icon} width={size * 0.62} height={size * 0.62} style={{ marginTop: size * 0.06 }} /> : <Text style={{ fontFamily: fonts.display, fontSize: size * 0.4, color: colors.ink }}>{(name[0] ?? '?').toUpperCase()}</Text>}
    </View>
  );
}

/** A letter avatar with a half-ring over the top: yellow when there is something new. */
export function RingBadge({ name, unread, size = 56, activity }: { name: string; unread?: boolean; size?: number; activity?: string | null }) {
  const r = size / 2 - 3;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ position: 'absolute' }}>
        <Path d={`M3 ${size / 2}A${r} ${r} 0 0 1 ${size - 3} ${size / 2}`} stroke={unread ? colors.gold : colors.lineStrong} strokeWidth={3.5} strokeLinecap="round" />
      </Svg>
      <View style={{ position: 'absolute', left: 6, top: 6 }}><LetterBadge name={name} size={size - 12} activity={activity} /></View>
    </View>
  );
}

export function Row({ left, title, subtitle, meta, right, onPress, tag }: {
  left?: React.ReactNode; title: string; subtitle?: string | null; meta?: string | null; right?: React.ReactNode; onPress?: () => void; tag?: string | null;
}) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, minHeight: 72 }}>
      {left}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>{title}</Text>
          {meta ? <Text style={{ fontFamily: fonts.body, fontSize: 12.5, color: colors.faint }}>{meta}</Text> : null}
        </View>
        {subtitle ? <Text numberOfLines={2} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, borderBottomWidth: 1, borderBottomColor: colors.line })}>{body}</Pressable>
  ) : <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}>{body}</View>;
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress}
      style={{ minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 20, backgroundColor: on ? colors.ink : colors.surface, marginRight: 8 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14.5, color: on ? '#ffffff' : colors.ink }}>{label}</Text>
    </Pressable>
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
      <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(22,18,14,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable accessible={false} style={{ backgroundColor: colors.ground, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 12, paddingBottom: insets.bottom + 20, maxHeight: '82%' }}>
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong, marginBottom: 14 }} />
          {title ? <Text accessibilityRole="header" style={{ fontFamily: fonts.title, fontSize: 22, letterSpacing: -0.3, color: colors.ink, marginBottom: 8 }}>{title}</Text> : null}
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
