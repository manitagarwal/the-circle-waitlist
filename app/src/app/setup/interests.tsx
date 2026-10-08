import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { InterestPicker } from '@/components/InterestPicker';
import { Body, Button, Screen, StepHeader, Title } from '@/components/ui';
import { INTERESTS_MAX, INTERESTS_MIN } from '@/lib/profile';
import { useSetup } from './_layout';

export default function Interests() {
  const r = useRouter();
  const { s, set } = useSetup();
  return (
    <Screen footer={<View style={{ flexDirection: 'row', gap: 10 }}>
      <Button label="Back" variant="secondary" onPress={() => r.back()} style={{ flexBasis: 112 }} />
      <Button label="Continue" onPress={() => r.push('/setup/about')} disabled={s.interestIds.length < INTERESTS_MIN} style={{ flex: 1 }} />
    </View>}>
      <StepHeader step={2} of={4} />
      <Title italic>What are you into?</Title>
      <Body style={{ marginTop: 6, fontSize: 14 }}>Pick {INTERESTS_MIN} to {INTERESTS_MAX}. These channels come first.</Body>
      <InterestPicker selected={s.interestIds} onChange={(ids) => set({ interestIds: ids })} />
    </Screen>
  );
}
