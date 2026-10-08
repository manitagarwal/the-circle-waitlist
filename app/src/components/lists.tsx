import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { Button } from './ui';

export function TabHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.title, fontSize: 28, color: colors.ink }}>{title}</Text>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.control, borderWidth: 1, borderColor: colors.line, padding: 3, marginVertical: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ flex: 1, minHeight: 40, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.gold : 'transparent' }}>
            <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.bodyMedium, fontSize: 14, color: on ? colors.onGold : colors.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text accessibilityRole="header" style={{ fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.faint, marginTop: 20, marginBottom: 8 }}>{children}</Text>
);

/** A round badge with the first letter, used for channels. */
export function LetterBadge({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.goldTint, borderWidth: 1, borderColor: colors.goldBorder, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.title, fontSize: size * 0.42, color: colors.goldText }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

export function Row({ left, title, subtitle, meta, right, onPress, tag }: {
  left?: React.ReactNode; title: string; subtitle?: string | null; meta?: string | null; right?: React.ReactNode; onPress?: () => void; tag?: string | null;
}) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, minHeight: 64 }}>
      {left}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>{title}</Text>
          {meta ? <Text style={{ fontFamily: fonts.body, fontSize: 12, color: tag ? colors.goldText : colors.faint }}>{meta}</Text> : null}
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
      style={{ minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: on ? colors.goldText : colors.line, backgroundColor: on ? colors.goldTint : colors.card, marginRight: 8 }}>
      <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 14, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function State({ loading, error, empty, onRetry }: { loading?: boolean; error?: string | null; empty?: string | null; onRetry?: () => void }) {
  if (loading) return <ActivityIndicator color={colors.goldText} style={{ marginTop: 40 }} />;
  if (error) return (
    <View style={{ marginTop: 32, alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.error, textAlign: 'center' }}>{error}</Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} style={{ alignSelf: 'stretch' }} /> : null}
    </View>
  );
  if (empty) return <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 12 }}>{empty}</Text>;
  return null;
}

import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** A bottom sheet over a dimmed background. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(33,28,22,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable accessible={false} style={{ backgroundColor: colors.ground, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: insets.bottom + 20, maxHeight: '80%' }}>
          {title ? <Text accessibilityRole="header" style={{ fontFamily: fonts.title, fontSize: 20, color: colors.ink, marginBottom: 8 }}>{title}</Text> : null}
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
        {defs.map((d) => <Chip key={d.key} label={values[d.key] ? `${d.label}: ${values[d.key]}` : d.label} on={!!values[d.key]} onPress={() => setOpen(d.key)} />)}
      </ScrollView>
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
