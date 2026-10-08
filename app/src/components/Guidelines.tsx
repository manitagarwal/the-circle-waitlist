import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

// Draft wording for the owner to review before launch.
const RULES = [
  ['Be who you say you are.', 'Real name, honest profile, one account.'],
  ['Show up, or leave early.', "If your plans change, leave a booking before the cut-off. No-shows cost your reliability score and the host's evening."],
  ['Treat people well.', "No harassment, pressure, or comments about someone's body, background or beliefs. If someone says no, that is the end of it."],
  ['Keep it safe.', 'Meet in public places. Share your plans with someone. If something feels wrong, leave and report it. Safety reports are read first.'],
  ['Keep this room private.', "Don't share other members' details or screenshots outside The Semi Circle."],
  ['No selling, spam or recruiting.', 'This is for good company, not for pitches.'],
  ['The ladder.', 'A warning, then a 7-day pause, then removal. Serious or safety reports can skip straight to removal.'],
] as const;

export function Guidelines() {
  return (
    <View style={{ gap: 14 }}>
      {RULES.map(([t, b]) => (
        <View key={t}>
          <Text style={{ fontFamily: fonts.titleMedium, fontSize: 17, color: colors.ink }}>{t}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 2 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}
