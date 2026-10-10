import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar, type BarProps } from '@/components/FloatingTabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
      <Tabs tabBar={(p) => <FloatingTabBar {...(p as unknown as BarProps)} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground } }}>
        <Tabs.Screen name="channels" options={{ title: 'Channels' }} />
        <Tabs.Screen name="events" options={{ title: 'Events' }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
  );
}
