import React, { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Logo, Notice, Screen, Title } from '@/components/ui';
import { api, useAuth } from '@/lib/auth';
import { friendly } from '@/lib/messages';

const day = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(new Date(iso));

/** A deleted account (30 days to restore) or a closed one (banned). */
export default function Closed() {
  const { member, refresh, signOut, gate } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const banned = gate === 'banned';
  const erase = member?.deleted_at ? day(new Date(new Date(member.deleted_at).getTime() + 30 * 86400000).toISOString()) : null;
  const restore = async () => { setBusy(true); setErr(null); try { await api.restoreAccount(); await refresh(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); } };
  return (
    <Screen footer={<View style={{ gap: 4 }}>{!banned ? <Button label="Restore my account" onPress={restore} loading={busy} /> : null}<Button label="Sign out" variant={banned ? 'primary' : 'link'} onPress={signOut} /></View>}>
      <View style={{ marginTop: 24 }}><Logo size="md" /></View>
      <View style={{ marginTop: 40 }}>
        <Title italic>{banned ? 'Your membership has ended.' : 'Your account is closed.'}</Title>
        {banned ? <Body style={{ marginTop: 10 }}>After repeated reports upheld by the team, your membership was ended. If you think this is a mistake, reply to any email from us.</Body> : (<>
          <Body style={{ marginTop: 10 }}>{erase ? `We'll erase your personal data on ${erase}.` : "We'll erase your personal data after 30 days."}</Body>
          <Body style={{ marginTop: 10 }}>Changed your mind? Restore your account any time before then and everything comes back as you left it: profile, friends and channels. Bookings you hosted stay cancelled.</Body>
        </>)}
        {err ? <Notice tone="error">{err}</Notice> : null}
      </View>
    </Screen>
  );
}
