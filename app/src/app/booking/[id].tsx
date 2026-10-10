import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bar } from '@/components/Bar';
import { PersonAvatar } from '@/components/Avatar';
import { SectionLabel, Sheet, State } from '@/components/lists';
import { Body, Button, Notice } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { ageRange, bookingDay, freeLeaveUntil, joinCheck, joinClosesAt, spots, startsIn, timeRange } from '@/lib/bookings';
import { clock } from '@/lib/format';
import { friendly } from '@/lib/messages';
import { interestIndex, loadInterestGroups } from '@/lib/interests';
import { useLoad } from '@/lib/useLoad';

const month = (iso: string) => new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(iso));

function Line({ k, v, note }: { k: string; v: string; note?: string | null }) {
  return (
    <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{k}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{v}</Text>
      {note ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.sage, marginTop: 2 }}>{note}</Text> : null}
    </View>
  );
}

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'leave' | 'cancel' | null>(null);

  const { data, error, loading, reload } = useLoad(async () => {
    const booking = await api.booking(id);
    if (!booking) return { booking: null };
    const [roster, host, me, score, groups] = await Promise.all([api.bookingRoster(id), api.profile(booking.host_id), api.myProfileBasics(), api.myScore().catch(() => null), loadInterestGroups(() => api.interestGroups()).catch(() => [])]);
    return { booking, roster, host, me, score, group: interestIndex(groups).get(booking.interest_id)?.group ?? null };
  }, [id]);

  const b = data?.booking ?? null;
  const act = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true); setErr(null);
    try { await fn(); after ? after() : await reload(); } catch (e) { setErr(friendly(e)); } finally { setBusy(false); setConfirm(null); }
  };

  let body: React.ReactNode = <State loading={loading} error={error} onRetry={reload} />;
  if (data && !b) body = <State empty="That booking isn't available." />;
  if (data && b && 'roster' in data) {
    const { roster, host, me, score, group } = data as Required<typeof data> & { booking: NonNullable<typeof b> };
    const sp = spots(b);
    const joined = b.my_status === 'joined' || b.is_host;
    const over = new Date(b.ends_at).getTime() < Date.now();
    const check = joinCheck(b, me);
    const age = ageRange(b);
    const qualifies = b.min_score == null || score == null ? null : score >= b.min_score;
    const menWanted = Math.max(0, (b.male_slots ?? 0) - b.male_joined), womenWanted = Math.max(0, (b.female_slots ?? 0) - b.female_joined);
    body = (<>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, color: colors.goldText }}>{(group ? `${group} · ${b.interest_name}` : b.interest_name).toUpperCase()}  ·  {b.kind === 'admin' ? 'HOSTED BY ADMIN' : 'PRIVATE EVENT'}</Text>
      <Text style={{ fontFamily: fonts.title, fontSize: 32, lineHeight: 39, color: colors.ink, marginTop: 6 }}>{b.title}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 6 }}>
        Hosted by <Text accessibilityRole="link" onPress={() => r.push({ pathname: '/member/[id]', params: { id: b.host_id } })} style={{ fontFamily: fonts.bodySemi, color: colors.ink, textDecorationLine: 'underline' }}>{b.host_username}</Text>{host ? `. ${host.bookings_hosted} ${host.bookings_hosted === 1 ? 'booking' : 'bookings'} hosted. ${host.member_since ? `Member since ${month(host.member_since)}.` : ''}` : ''}
      </Text>
      {b.status === 'cancelled' ? <Notice tone="error">This booking was cancelled by the host.</Notice> : null}

      <View style={{ marginTop: 16 }}>
        <Line k={`${bookingDay(b.starts_at)}, ${timeRange(b.starts_at, b.ends_at)}`} v={startsIn(b.starts_at)} />
        {b.close_hours != null ? <Line k="Joining closes" v={`${bookingDay(joinClosesAt(b.starts_at, b.close_hours).toISOString())}, ${clock(joinClosesAt(b.starts_at, b.close_hours))}`} /> : null}
        <Line k={[b.venue_name, b.area].filter(Boolean).join(', ') || 'Location'} v={joined && b.address_outer ? b.address_outer : "Exact location appears once you've joined."} />
      </View>

      <SectionLabel>Who's in</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {roster.map((p) => (
          <Pressable key={p.member_id} accessibilityRole="button" accessibilityLabel={`View ${p.username}'s profile`} onPress={() => r.push({ pathname: '/member/[id]', params: { id: p.member_id } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12, backgroundColor: colors.surface, borderRadius: 24 }}>
            <PersonAvatar person={p} size={36} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }}>{p.username}</Text>
          </Pressable>
        ))}
        {Array.from({ length: menWanted }, (_, i) => <Text key={`m${i}`} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.faint, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: 24 }}>Man open</Text>)}
        {Array.from({ length: womenWanted }, (_, i) => <Text key={`f${i}`} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.faint, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: 24 }}>Woman open</Text>)}
      </View>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 8 }}>{sp.count}{sp.left ? `. ${sp.left} left.` : '.'}</Text>

      {age || b.min_score != null ? <SectionLabel>To join</SectionLabel> : null}
      {age ? <Line k={`Age ${age}`} v={me.age != null ? `You're ${me.age}` : ''} note={me.age != null && joinCheck({ ...b, is_host: false, my_status: null, male_slots: null, female_slots: null, joined_count: 0 }, me).ok ? 'You qualify' : null} /> : null}
      {b.min_score != null ? <Line k="Minimum reliability" v={`${b.min_score} or higher`} note={qualifies === true ? 'You qualify' : qualifies === false ? 'Not yet' : null} /> : null}

      {b.description ? <Body style={{ marginTop: 16 }}>{b.description}</Body> : null}
      {err ? <Notice tone="error">{err}</Notice> : null}

      <View style={{ marginTop: 24, gap: 10 }}>
        {b.status === 'cancelled' ? null : joined ? (<>
          {b.channel_id ? <Button label="Open booking chat" onPress={() => r.push({ pathname: '/channel/[id]', params: { id: b.channel_id! } })} /> : null}
          {b.is_host && over ? <Button label="Mark who showed up" onPress={() => r.push({ pathname: '/booking/attendance/[id]', params: { id } })} /> : null}
          {b.is_host && !over && (b.status === 'open' || b.status === 'full') ? <Button label="Cancel booking" variant="secondary" onPress={() => setConfirm('cancel')} /> : null}
          {!b.is_host && !over ? <Button label="Leave booking" variant="secondary" onPress={() => setConfirm('leave')} /> : null}
        </>) : (
          <Button label="Join booking" onPress={() => act(() => api.joinBooking(id))} loading={busy} disabled={!check.ok} />
        )}
        {!joined && !check.ok && check.reason ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, textAlign: 'center' }}>{check.reason}</Text> : null}
      </View>
      {b.status !== 'cancelled' && !over ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 12 }}>Free to leave until {clock(freeLeaveUntil(b.starts_at))}. After that it counts against you.</Text>) : null}
    </>);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Booking" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>{body}</ScrollView>
      <Sheet visible={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'cancel' ? 'Cancel this booking?' : 'Leave this booking?'}>
        <Body style={{ marginBottom: 16 }}>{confirm === 'cancel' ? "Everyone who joined is told. Its chat closes tomorrow." : b && Date.now() > freeLeaveUntil(b.starts_at).getTime() ? 'It starts soon, so leaving now counts against your reliability score.' : 'Leaving now is free. After the cut-off it would count against you.'}</Body>
        <View style={{ gap: 8 }}>
          <Button label={confirm === 'cancel' ? 'Cancel booking' : 'Leave booking'} loading={busy} onPress={() => act(() => (confirm === 'cancel' ? api.cancelBooking(id) : api.leaveBooking(id)))} />
          <Button label="Keep it" variant="link" onPress={() => setConfirm(null)} />
        </View>
      </Sheet>
    </View>
  );
}
