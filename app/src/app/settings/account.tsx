import React, { useState } from 'react';
import { Platform, ScrollView, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Bar } from '@/components/Bar';
import { Sheet } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors, fonts } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';
import { Info } from '@/components/Info';

export default function AccountData() {
  const { refresh } = useAuth();
  const [busy, setBusy] = useState<'' | 'export' | 'delete'>('');
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const exportIt = async () => {
    setBusy('export'); setErr(null); setNote(null);
    try {
      const text = JSON.stringify(await api.exportData(), null, 2);
      if (Platform.OS === 'web') { await Clipboard.setStringAsync(text); setNote('Copied to your clipboard.'); }
      else await Share.share({ title: 'My Semi Circle data', message: text });
    } catch (e) { setErr(friendly(e)); } finally { setBusy(''); }
  };
  const del = async () => {
    setBusy('delete'); setErr(null);
    try { await api.deleteAccount(); await refresh(); } // routing moves to the closed-account screen
    catch (e) { setErr(friendly(e)); setConfirm(false); } finally { setBusy(''); }
  };
  const step = (n: number, t: string) => (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
      <Text style={{ width: 22, fontFamily: fonts.title, fontSize: 21, color: colors.goldText }}>{n}</Text>
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted }}>{t}</Text>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Your data and account" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text style={{ fontFamily: fonts.title, fontSize: 26, color: colors.ink }}>Take a copy</Text>
        <Info text={"Everything we hold about you in one file: your profile, application, friends, bookings, messages, reports you've filed and your reliability history."} />
        <Button label="Export my data" variant="secondary" onPress={exportIt} loading={busy === 'export'} style={{ marginTop: 14 }} />
        {note ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.sage, marginTop: 8 }}>{note}</Text> : null}

        <Text style={{ fontFamily: fonts.title, fontSize: 26, color: colors.ink, marginTop: 32 }}>Delete my account</Text>
        {step(1, "You're hidden and signed out straight away.")}
        {step(2, 'Bookings you host are cancelled, and the people who joined are told.')}
        {step(3, 'You have 30 days to change your mind. After that your personal data is erased for good.')}
        {err ? <Notice tone="error">{err}</Notice> : null}
        <Button label="Delete my account" variant="secondary" onPress={() => setConfirm(true)} style={{ marginTop: 16 }} />
        <Info text={"Your messages stay in the channels they were sent to, under an anonymous name. Reports and reliability history are kept without your details."} />
      </ScrollView>
      <Sheet visible={confirm} onClose={() => setConfirm(false)} title="Delete your account?">
        <Body style={{ marginBottom: 16 }}>You can restore it any time in the next 30 days. After that it's gone for good.</Body>
        <View style={{ gap: 8 }}><Button label="Delete my account" loading={busy === 'delete'} onPress={del} /><Button label="Keep my account" variant="link" onPress={() => setConfirm(false)} /></View>
      </Sheet>
    </View>
  );
}
