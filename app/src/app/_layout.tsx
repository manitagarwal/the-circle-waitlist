import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_300Light_Italic, Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Routes() {
  const { gate, recovery, paused, ackPaused } = useAuth();
  const normal = !recovery;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground }, animation: 'fade' }}>
      <Stack.Protected guard={gate === 'public'}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="code" />
      </Stack.Protected>
      <Stack.Protected guard={normal && (gate === 'public' || gate === 'apply')}>
        <Stack.Screen name="apply" />
      </Stack.Protected>
      <Stack.Protected guard={normal && gate === 'review'}>
        <Stack.Screen name="status" />
      </Stack.Protected>
      <Stack.Protected guard={normal && gate === 'accepted'}>
        <Stack.Screen name="claim" />
      </Stack.Protected>
      <Stack.Protected guard={recovery && gate !== 'public' && gate !== 'loading'}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={normal && gate === 'password'}>
        <Stack.Screen name="password" />
      </Stack.Protected>
      <Stack.Protected guard={normal && gate === 'setup'}>
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={normal && (gate === 'closed' || gate === 'banned')}>
        <Stack.Screen name="closed" />
      </Stack.Protected>
      <Stack.Protected guard={normal && gate === 'app' && paused && !ackPaused}>
        <Stack.Screen name="paused" />
      </Stack.Protected>
      <Stack.Protected guard={normal && gate === 'app' && (!paused || ackPaused)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="channel/[id]" />
        <Stack.Screen name="channel/new" />
        <Stack.Screen name="channel/settings/[id]" />
        <Stack.Screen name="dm/[id]" />
        <Stack.Screen name="member/[id]" />
        <Stack.Screen name="booking/[id]" />
        <Stack.Screen name="booking/new" />
        <Stack.Screen name="booking/attendance/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/profile" />
        <Stack.Screen name="settings/interests" />
        <Stack.Screen name="settings/password" />
        <Stack.Screen name="settings/blocked" />
        <Stack.Screen name="settings/account" />
        <Stack.Screen name="settings/guidelines" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Fraunces_300Light_Italic, Fraunces_400Regular, Fraunces_500Medium, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  useEffect(() => { if (loaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded]);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
