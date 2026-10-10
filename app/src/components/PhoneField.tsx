import React, { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Sheet } from './lists';
import { colors, fonts, radius } from '@/theme';
import { PICKER, maxLength, readInput } from '@/lib/phone';

/** A mobile number with its own country code box. The code defaults to +91. */
export function PhoneField({ dial, number, onChange, error, label = 'Phone number' }: {
  dial: string; number: string; onChange: (v: { dial: string; number: string }) => void; error?: string | null; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const border = error ? colors.error : focus ? colors.goldText : colors.line;
  const box = { height: 48, borderRadius: radius.control, backgroundColor: colors.card, borderWidth: 1, borderColor: border } as const;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Country code, plus ${dial}. Change`} onPress={() => setOpen(true)}
          style={[box, { minWidth: 84, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink }}>+{dial}</Text>
          <Text style={{ fontSize: 11, color: colors.faint }}>▼</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={label} value={number} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="98765 43210" placeholderTextColor={colors.faint}
          maxLength={dial === '91' ? 16 : maxLength(dial) + 6} // room to paste "+91 98765 43210"; it is trimmed on input
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onChangeText={(t) => { const r = readInput(dial, t); onChange(r.resolved ? { dial: r.dial, number: r.national } : { dial, number: t.slice(0, 6) }); }}
          style={[box, { flex: 1, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts.body, color: colors.ink }]}
        />
      </View>
      {error ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, marginTop: 6 }}>{error}</Text> : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Country code">
        <FlatList data={PICKER} keyExtractor={(c) => c.dial + c.name} style={{ maxHeight: 420 }}
          renderItem={({ item }) => {
            const on = item.dial === dial;
            return (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { onChange({ dial: item.dial, number: number.slice(0, maxLength(item.dial)) }); setOpen(false); }}
                style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.body, fontSize: 16, color: colors.ink }}>{item.name}</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.muted }}>+{item.dial}</Text>
              </Pressable>
            );
          }} />
      </Sheet>
    </View>
  );
}
