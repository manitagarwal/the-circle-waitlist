import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { PasswordForm } from '@/components/PasswordForm';
import { Body } from '@/components/ui';
import { colors } from '@/theme';

export default function ChangePassword() {
  const r = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Password" />
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Body>Choose a new password. You'll use it the next time you log in.</Body>
        <PasswordForm submitLabel="Save password" onDone={() => r.back()} />
      </ScrollView>
    </View>
  );
}
