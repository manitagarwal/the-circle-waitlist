import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Body, Button, Notice, Screen, StepHeader, Title } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { AVATAR_IDS } from '@/lib/avatars';
import { pickPhoto } from '@/lib/photo';
import { useSetup } from './_layout';

export default function Photo() {
  const r = useRouter();
  const { s, set } = useSetup();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    setErr(null); setBusy(true);
    try {
      const uri = await pickPhoto();
      if (uri) set({ photoUri: uri, avatarId: null });
    } catch (e) { setErr((e as Error).message.includes('5 MB') ? (e as Error).message : "Couldn't open that photo. Try another."); } finally { setBusy(false); }
  };

  return (
    <Screen footer={<Button label="Continue" onPress={() => r.push('/setup/interests')} disabled={!s.photoUri && !s.avatarId} />}>
      <StepHeader step={1} of={4} />
      <Title italic>Show your face. Or pick one.</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Every member's profile is visible to every other member. That's the point.</Body>
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <Avatar uri={s.photoUri} avatarId={s.avatarId} size={112} />
      </View>
      <Button label={s.photoUri ? 'Choose a different photo' : 'Upload a photo'} variant="secondary" onPress={pick} loading={busy} style={{ marginTop: 16 }} />
      <Text style={{ textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 8 }}>JPEG, PNG or WebP. Up to 5 MB.</Text>
      {err ? <Notice tone="error">{err}</Notice> : null}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, marginTop: 24 }}>Or choose an avatar</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {AVATAR_IDS.map((id) => {
          const on = !s.photoUri && s.avatarId === id;
          return (
            <Pressable key={id} accessibilityRole="radio" accessibilityLabel={`Avatar ${id}`} accessibilityState={{ selected: on }}
              onPress={() => set({ avatarId: id, photoUri: null })}
              style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? colors.goldText : 'transparent' }}>
              <Avatar avatarId={id} size={62} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
