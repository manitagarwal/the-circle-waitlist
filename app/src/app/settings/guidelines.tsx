import React from 'react';
import { ScrollView, View } from 'react-native';
import { Bar } from '@/components/Bar';
import { Guidelines } from '@/components/Guidelines';
import { colors } from '@/theme';

export default function GuidelinesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Community guidelines" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}><Guidelines /></ScrollView>
    </View>
  );
}
