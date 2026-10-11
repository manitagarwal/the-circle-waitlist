import React from 'react';
import { Text, View } from 'react-native';
import { Enter } from './fx';
import { colors, fonts } from '@/theme';

const LINES = [
  ['Padel is just tennis for people who like walls.', 'Fact-checked by nobody.'],
  ['Say yes now. Panic on the day.', 'That is the full programme.'],
  ['Delhi traffic is the real workout.', 'The booking is the reward.'],
  ['Chai counts as a warm-up.', 'We checked.'],
  ['Plans made at midnight rarely happen.', 'These ones are different. They have a time and a place.'],
  ['You have been scrolling a while.', 'Hold a button, join something, go outside.'],
];

/** A small dry aside between cards, so a long list does not feel like a spreadsheet. */
export function Interlude({ n }: { n: number }) {
  const [a, b] = LINES[n % LINES.length];
  return (
    <Enter>
      <View style={{ paddingVertical: 22, paddingHorizontal: 8, alignItems: 'center' }}>
        <View style={{ width: 28, height: 14, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderWidth: 2, borderBottomWidth: 0, borderColor: colors.lineStrong, marginBottom: 10 }} />
        <Text style={{ fontFamily: fonts.title, fontSize: 19, lineHeight: 25, color: colors.ink, textAlign: 'center' }}>{a}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 4 }}>{b}</Text>
      </View>
    </Enter>
  );
}
