import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from './Icon';
import { colors, fonts } from '@/theme';

/** A section with a tappable header that folds its content away. Used for the activity buckets. */
export function Collapsible({ title, count, selected, defaultOpen = true, children }: {
  title: string; count?: number; selected?: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginTop: 12 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${title}, ${open ? 'expanded' : 'collapsed'}`} onPress={() => setOpen((o) => !o)}
        style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: colors.surface, borderRadius: 16 }}>
        <Text style={{ flex: 1, fontFamily: fonts.title, fontSize: 20, color: colors.ink }}>{title}</Text>
        {selected ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.onGold, backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8, overflow: 'hidden' }}>{selected}</Text> : null}
        {count != null ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginRight: 8 }}>{count}</Text> : null}
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}><Icon name="chevron" size={18} color={colors.faint} /></View>
      </Pressable>
      {open ? <View style={{ paddingTop: 6 }}>{children}</View> : null}
    </View>
  );
}
