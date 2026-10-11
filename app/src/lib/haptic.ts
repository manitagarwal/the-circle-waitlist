import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** A small physical tap. Silent on the web and wherever the phone can't do it. */
export const tap = (kind: 'light' | 'medium' | 'success' = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch { /* no haptics here */ }
};
