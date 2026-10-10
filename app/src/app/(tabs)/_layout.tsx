import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar, type BarProps } from '@/components/FloatingTabBar';
import { colors } from '@/theme';
import { UnreadProvider } from '@/lib/unread';

export default function TabsLayout() {
  return (
    <UnreadProvider>
      <Tabs tabBar={(p) => <FloatingTabBar {...(p as unknown as BarProps)} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground } }}>
        <Tabs.Screen name="channels" options={{ title: 'Channels' }} />
        <Tabs.Screen name="events" options={{ title: 'Events' }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        {/* Activity and Messages live in the header, not in the bottom bar */}
        <Tabs.Screen name="activity" options={{ title: 'Activity', href: null }} />
        <Tabs.Screen name="messages" options={{ title: 'Messages', href: null }} />
      </Tabs>
    </UnreadProvider>
  );
}
