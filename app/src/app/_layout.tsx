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
  const { gate, recovery } = useAuth();
  const entry = !recovery && (gate === 'public' || gate === 'invited');
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground }, animation: 'fade' }}>
      <Stack.Protected guard={entry}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="code" />
        <Stack.Screen name="join" />
        <Stack.Screen name="status" />
        <Stack.Screen name="apply" />
      </Stack.Protected>
      <Stack.Protected guard={!recovery && gate === 'invited'}>
        <Stack.Screen name="redeem" />
      </Stack.Protected>
      <Stack.Protected guard={recovery && (gate === 'app' || gate === 'setup')}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={!recovery && gate === 'setup'}>
        <Stack.Screen name="password" />
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={!recovery && gate === 'app'}>
        <Stack.Screen name="home" />
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
