import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { ArchPhoto } from '@/components/Arch';
import { FadeUp } from '@/components/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { ReportSheet } from '@/components/ReportSheet';
import { Row, SectionLabel, Sheet, State } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api, useAuth } from '@/lib/auth';
import { bookingDay } from '@/lib/bookings';
import { useSignedUrl } from '@/lib/media';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';

const month = (iso: string) => new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(iso));

export default function MemberProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const { member } = useAuth();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const { data, error, loading, reload } = useLoad(async () => {
    const [profile, rel, hosted, theirFriends, myFriends] = await Promise.all([
      api.profile(id), api.friendship(id), api.hostedBy(id).catch(() => []), api.friends(id).catch(() => []), member ? api.friends(member.id).catch(() => []) : Promise.resolve([]),
    ]);
    const mine = new Set(myFriends.map((f) => f.id));
    return { profile, rel, hosted, common: theirFriends.filter((f) => mine.has(f.id)) };
  }, [id]);
  const photo = useSignedUrl(data?.profile?.photo_path);
  const p = data?.profile;
  const upcoming = (data?.hosted ?? []).filter((b) => b.status === 'open' || b.status === 'full').filter((b) => new Date(b.starts_at) > new Date());

  const act = async (fn: () => Promise<unknown>, after?: () => void) => { setBusy(true); setErr(null); setMenu(false); try { await fn(); after ? after() : await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); setConfirmBlock(false); } };
  const isMe = id === member?.id;
  const status = data?.rel?.status;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title={p?.full_name ?? 'Profile'} right={!isMe && p ? <Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => setMenu(true)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}><Icon name="dots" /></Pressable> : undefined} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <State loading={loading} error={error} onRetry={reload} empty={data && !p ? "That profile isn't available." : null} />
        {p ? (<>
          <FadeUp distance={40}><View style={{ marginTop: 4 }}><ArchPhoto uri={photo} avatarId={p.avatar_id} maxWidth={350} /></View></FadeUp>
          <FadeUp delay={350}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 37, lineHeight: 41, color: colors.ink, marginTop: 16 }}>{p.full_name ?? p.username}</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.muted, marginTop: 4 }}>{['@' + p.username, p.age, p.area, p.field_of_work].filter(Boolean).join(' · ')}</Text>
          </FadeUp>
          {p.bio ? <FadeUp delay={450}><Text style={{ fontFamily: fonts.body, fontSize: 16.5, lineHeight: 24, color: colors.ink, marginTop: 12 }}>{p.bio}</Text></FadeUp> : null}
          <FadeUp delay={550}><Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 12 }}>{p.bookings_hosted} {p.bookings_hosted === 1 ? 'booking' : 'bookings'} hosted · Member since {month(p.member_since)}</Text></FadeUp>
          {err ? <Notice tone="error">{err}</Notice> : null}

          {p.interests?.length ? (<><SectionLabel>Into</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{p.interests.map((i) => <Text key={i} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.surface, overflow: 'hidden' }}>{i}</Text>)}</View></>) : null}

          {upcoming.length ? (<><SectionLabel>Hosting</SectionLabel>
            {upcoming.map((b) => <Row key={b.id} title={b.title} subtitle={`${bookingDay(b.starts_at)}${b.area ? `. ${b.area}` : ''}`} onPress={() => r.push({ pathname: '/booking/[id]', params: { id: b.id } })} />)}</>) : null}

          {data!.common.length ? (<><SectionLabel>Friends in common</SectionLabel>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>{data!.common.slice(0, 3).map((f) => f.username).join(', ')}{data!.common.length > 3 ? ` and ${data!.common.length - 3} others` : ''}</Text></>) : null}
        </>) : null}
      </ScrollView>
      {p && !isMe ? (
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
          {status === 'accepted' ? <Button label="✓  Friends" variant="secondary" disabled onPress={() => {}} style={{ flex: 1 }} />
            : status === 'pending' ? <Button label={data!.rel!.requested_by_me ? '✓  Request sent' : 'Wants to be friends'} variant="secondary" disabled onPress={() => {}} style={{ flex: 1 }} />
            : <Button label="Add friend" variant="secondary" loading={busy} onPress={() => act(() => api.sendFriendRequest(id, null))} style={{ flex: 1 }} />}
          <Button label="Message" onPress={() => r.push({ pathname: '/dm/[id]', params: { id } })} style={{ flex: 1 }} />
        </View>) : null}

      <Sheet visible={menu} onClose={() => setMenu(false)} title={p ? `@${p.username}` : ''}>
        <View style={{ gap: 8 }}>
          {status === 'accepted' ? <Button label="Unfriend" variant="secondary" onPress={() => act(() => api.unfriend(id))} /> : null}
          <Button label="Report" variant="secondary" onPress={() => { setMenu(false); setReport(true); }} />
          <Button label="Block" variant="secondary" onPress={() => { setMenu(false); setConfirmBlock(true); }} />
          <Button label="Close" variant="link" onPress={() => setMenu(false)} />
        </View>
      </Sheet>
      <Sheet visible={confirmBlock} onClose={() => setConfirmBlock(false)} title="Block this member?">
        <Body style={{ marginBottom: 16 }}>You won't see each other's profiles, messages or requests. Their messages in shared channels are hidden from you. You can unblock them in Settings.</Body>
        <View style={{ gap: 8 }}><Button label="Block" loading={busy} onPress={() => act(() => api.block(id), () => r.back())} /><Button label="Cancel" variant="link" onPress={() => setConfirmBlock(false)} /></View>
      </Sheet>
      <ReportSheet member={report && p ? p : null} onClose={() => setReport(false)} onBlock={() => setConfirmBlock(true)} />
    </View>
  );
}
