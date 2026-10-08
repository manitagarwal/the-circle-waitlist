import React from 'react';
import { ScrollView } from 'react-native';

/**
 * A sideways row of chips. On a phone a horizontal ScrollView inside a vertical one grows to fill any spare
 * height and stretches its children into tall blocks, so it is pinned to its content height here.
 */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}
