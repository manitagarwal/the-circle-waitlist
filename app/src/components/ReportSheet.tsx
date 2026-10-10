import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { Sheet } from './lists';
import { Body, Button, Notice, TextField } from './ui';
import { Chip } from './lists';
import { colors, fonts } from '@/theme';
import { REPORT_CATEGORIES } from '@/lib/api';
import { api } from '@/lib/auth';
import { friendly } from '@/lib/messages';

/** Report a member. They are never told who reported; a person on the team reads every report. */
export function ReportSheet({ member, context, onClose, onBlock }: {
  member: { id: string; username: string; full_name?: string | null } | null;
  context?: { channel_id?: string; message_id?: string; booking_id?: string };
  onClose: (sent?: boolean) => void;
  onBlock?: () => void;
}) {
  const [cat, setCat] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [safety, setSafety] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const close = () => { setCat(null); setReason(''); setSafety(false); setErr(null); const was = sent; setSent(false); onClose(was); };
  const send = async () => {
    if (!member || !cat) return;
    setBusy(true); setErr(null);
    try { await api.report({ member: member.id, category: cat, reason: reason.trim(), safety, context }); setSent(true); }
    catch (e) { setErr(friendly(e)); } finally { setBusy(false); }
  };

  return (
    <Sheet visible={!!member} onClose={close} title={member ? `Report ${member.username}` : ''}>
      {sent ? (<View style={{ gap: 12 }}>
        <Body>Thank you. A person on the team will read it. {member?.username} won't be told who reported.</Body>
        <Button label="Done" onPress={close} />
      </View>) : (
        <ScrollView keyboardShouldPersistTaps="handled">
          <Body style={{ fontSize: 14 }}>They won't be told who reported. A person on the team reads every report.</Body>
          <View style={{ marginTop: 12, gap: 8 }}>
            {REPORT_CATEGORIES.map((c) => <View key={c.value} style={{ alignItems: 'flex-start' }}><Chip label={c.label} on={cat === c.value} onPress={() => setCat(c.value)} /></View>)}
          </View>
          <TextField label="What happened? Required." value={reason} onChangeText={setReason} multiline maxLength={1000} style={{ height: 96, paddingTop: 12, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>This is a safety concern.</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted }}>Something happened at a meetup. We'll treat it as urgent.</Text>
            </View>
            <Switch accessibilityLabel="This is a safety concern" value={safety} onValueChange={setSafety} trackColor={{ true: colors.ink, false: colors.lineStrong }} thumbColor={colors.ground} />
          </View>
          {err ? <Notice tone="error">{err}</Notice> : null}
          <Button label="Send report" onPress={send} loading={busy} disabled={!cat || !reason.trim()} style={{ marginTop: 16 }} />
          {onBlock ? <Button label="Block instead" variant="secondary" onPress={() => { close(); onBlock(); }} style={{ marginTop: 8 }} /> : null}
        </ScrollView>
      )}
    </Sheet>
  );
}
