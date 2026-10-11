import { useCity } from '@/lib/city';
import { NotLive } from '@/components/NotLive';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Enter, PulseDot, Skeleton, useCountdown } from '@/components/fx';
import { useRouter } from 'expo-router';
import { PersonAvatar } from '@/components/Avatar';
import { PhotoCard } from '@/components/PhotoCard';
import { PressScale } from '@/components/motion';
import { LetterBadge, RingBadge, Row, State, TabHeader, WithDot } from '@/components/lists';
import { Button } from '@/components/ui';
import { SvgXml } from 'react-native-svg';
import { colors, fonts, isDark, radius } from '@/theme';
import { activityIcon } from '@/lib/activityIcons';
import { api, useAuth } from '@/lib/auth';
import { bookingDay, spots, timeRange } from '@/lib/bookings';
import { priceText } from '@/lib/events';
import { listStamp } from '@/lib/format';
import { comingUp, greeting, startingSoon } from '@/lib/home';
import { useSignedUrl } from '@/lib/media';
import { toneFor } from '@/lib/tones';
import { useUnread } from '@/lib/unread';
import { useLoad } from '@/lib/useLoad';

const Heading = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 10 }}>
    <Text accessibilityRole="header" style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 2, textTransform: 'uppercase', color: colors.faint }}>{title}</Text>
    {action ? <Text accessibilityRole="button" onPress={onAction} style={{ fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink, padding: 6 }}>{action}</Text> : null}
  </View>
);

type Plan = ReturnType<typeof comingUp>[number];
const CARD = 252, GAP = 12;
const urgent = (b: { joined_count: number; headcount_max: number | null }) => b.headcount_max != null && b.headcount_max - b.joined_count <= 2;

/** Your very next plan, a big photo with a live countdown. */
function NextCard({ p, onPress }: { p: Plan; onPress: () => void }) {
  const cd = useCountdown(p.startsAt, p.endsAt);
  const cover = useSignedUrl(p.coverPath, 'event-covers');
  return (
    <PhotoCard uri={cover} photoPath={p.photoPath} activity={p.interest} height={300} radius={28} onPress={onPress} label={`${p.title}, ${cd.text}`}
      top={<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(250,248,244,0.94)', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 }}>
        {cd.soon ? <PulseDot size={8} color="#1b1a18" /> : null}
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: '#1b1a18' }}>{cd.text}</Text>
      </View>}>
      <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 32, lineHeight: 36, color: '#faf8f4' }}>{p.title}</Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(250,248,244,0.9)', marginTop: 6 }}>{bookingDay(p.startsAt)}, {timeRange(p.startsAt, p.endsAt).split(' to ')[0]}{p.where ? `  ·  ${p.where}` : ''}</Text>
    </PhotoCard>
  );
}

/** A further plan in the swipe row: the card in the middle grows a little, the ones at the edges recede. */
function PlanCard({ p, i, x, onPress }: { p: Plan; i: number; x: SharedValue<number>; onPress: () => void }) {
  const cover = useSignedUrl(p.coverPath, 'event-covers');
  const a = useAnimatedStyle(() => {
    const d = Math.abs(x.value - i * (CARD + GAP)) / (CARD + GAP);
    return { transform: [{ scale: interpolate(d, [0, 1], [1, 0.94], Extrapolation.CLAMP) }], opacity: interpolate(d, [0, 1], [1, 0.7], Extrapolation.CLAMP) };
  });
  return (
    <Animated.View style={[{ width: CARD, marginRight: GAP }, a]}>
      <PhotoCard uri={cover} photoPath={p.photoPath} activity={p.interest} height={210} radius={24} onPress={onPress} label={p.title}
        top={<Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: '#faf8f4' }}>{bookingDay(p.startsAt)}, {timeRange(p.startsAt, p.endsAt).split(' to ')[0]}</Text>}>
        <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 22, lineHeight: 26, color: '#faf8f4' }}>{p.title}</Text>
        {p.where ? <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 13, color: 'rgba(250,248,244,0.88)', marginTop: 4 }}>{p.where}</Text> : null}
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: 'rgba(250,248,244,0.85)', marginTop: 4 }}>{p.note}</Text>
      </PhotoCard>
    </Animated.View>
  );
}

/** What shows while Home loads: the shape of the page, shimmering. */
function HomeSkeleton() {
  return (
    <View style={{ marginTop: 30, gap: 14 }}>
      <Skeleton h={12} w={90} />
      <Skeleton h={190} r={28} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>{[0, 1, 2, 3].map((k) => <Skeleton key={k} w={64} h={64} r={32} />)}</View>
      {[0, 1, 2].map((k) => <View key={k} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Skeleton w={52} h={52} r={26} /><View style={{ flex: 1, gap: 8 }}><Skeleton h={14} w="70%" /><Skeleton h={12} w="45%" /></View></View>)}
    </View>
  );
}

function FeaturedEvent({ e, onPress }: { e: { id: string; title: string; cover_path: string | null; photo_path?: string | null; interest_name: string | null; starts_at: string; venue_name: string | null; area: string | null; price_inr: number }; onPress: () => void }) {
  const cover = useSignedUrl(e.cover_path, 'event-covers');
  return (
    <PhotoCard uri={cover} photoPath={e.photo_path} activity={e.interest_name} height={260} radius={26} onPress={onPress} label={e.title}
      top={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ backgroundColor: 'rgba(250,248,244,0.94)', borderRadius: 14, paddingHorizontal: 12, height: 28, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#1b1a18' }}>{bookingDay(e.starts_at)}</Text></View>
        <View style={{ backgroundColor: 'rgba(27,26,24,0.85)', borderRadius: 14, paddingHorizontal: 12, height: 28, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#faf8f4' }}>{e.price_inr > 0 ? `from ${priceText(e.price_inr)}` : 'Free'}</Text></View>
      </View>}>
      <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: '#faf8f4' }}>{e.title}</Text>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(250,248,244,0.9)', marginTop: 4 }}>{[e.venue_name, e.area].filter(Boolean).join(', ')}</Text>
    </PhotoCard>
  );
}

function HomeInner() {
  const r = useRouter();
  const { member } = useAuth();
  const unread = useUnread();
  const city = useCity();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const onCarousel = useAnimatedScrollHandler((e) => { x.value = e.contentOffset.x; });
  const titleAnim = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 120], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(y.value, [-120, 0, 160], [14, 0, 46], Extrapolation.CLAMP) }, { scale: interpolate(y.value, [-120, 0], [1.06, 1], Extrapolation.CLAMP) }],
  }));
  const { data, error, loading, refreshing, pull, reload } = useLoad(async () => {
    const [profile, mine, upcoming, events, channels, dms, previews] = await Promise.all([
      api.profile(member!.id).catch(() => null), api.bookingsMine().catch(() => []), api.bookingsUpcoming().catch(() => []), api.events().catch(() => []),
      api.channels().catch(() => []), api.dms().catch(() => []), api.channelPreviews().catch(() => []),
    ]);
    return { profile, mine, upcoming, events, channels, dms, previews };
  });

  const first = (data?.profile?.full_name ?? data?.profile?.username ?? member?.username ?? '').split(' ')[0];
  const plans = useMemo(() => (data ? comingUp(data.mine, data.events) : []), [data]);
  const soon = useMemo(() => (data ? startingSoon(data.upcoming, data.profile?.interests ?? []) : []), [data]);
  const lobbies = useMemo(() => (data?.channels ?? []).filter((c) => c.kind === 'lobby' && c.is_member && c.city_id === city.id).sort((a, b) => (unread.byChannel[b.id] ?? 0) - (unread.byChannel[a.id] ?? 0) || a.name.localeCompare(b.name)).slice(0, 12), [data, unread.byChannel]);
  const featured = useMemo(() => (data?.events ?? []).filter((e) => e.status === 'published' && !e.my_status && new Date(e.ends_at) > new Date()).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null, [data]);
  const chats = useMemo(() => {
    if (!data) return [];
    const prev = Object.fromEntries(data.previews.map((p) => [p.channel_id, p]));
    const fromDms = data.dms.filter((d) => unread.byChannel[d.channel_id]).map((d) => ({ key: d.channel_id, at: d.last_at ?? '', title: d.username, sub: d.last_body ?? '', n: unread.byChannel[d.channel_id], dm: d, go: () => r.push({ pathname: '/dm/[id]', params: { id: d.other_id } }) }));
    const fromChannels = data.channels.filter((c) => c.kind !== 'lobby' && c.is_member && unread.byChannel[c.id]).map((c) => ({ key: c.id, at: prev[c.id]?.last_at ?? c.created_at, title: c.name, sub: prev[c.id] ? `${prev[c.id].sender_username ?? 'Someone'}: ${prev[c.id].body}` : '', n: unread.byChannel[c.id], dm: null, ch: c, go: () => r.push({ pathname: '/channel/[id]', params: { id: c.id } }) }));
    return [...fromDms, ...fromChannels].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
  }, [data, unread.byChannel, r]);

  void width;
  const openPlan = (p: { kind: string; id: string }) => r.push(p.kind === 'event' ? { pathname: '/event/[id]', params: { id: p.id } } : { pathname: '/booking/[id]', params: { id: p.id } });

  return (
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: colors.ground }}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 4, paddingBottom: 130 }}
      refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={pull} tintColor={colors.ink} />}>
      <TabHeader title={`${greeting()},\n${first || 'friend'}.`} titleStyle={titleAnim} />
      {loading && !data ? <HomeSkeleton /> : <State loading={false} error={error} onRetry={reload} />}
      {data ? (<>
        <Enter index={0}>
          <Heading title={plans.length ? 'Up next' : 'Coming up'} action={plans.length ? 'All bookings' : undefined} onAction={() => r.navigate('/bookings' as never)} />
          {plans.length ? <NextCard p={plans[0]} onPress={() => openPlan(plans[0])} /> : (
            <View style={{ padding: 18, borderRadius: radius.card, backgroundColor: colors.surface, gap: 12 }}>
              <Text style={{ fontFamily: fonts.title, fontSize: 22, color: colors.ink }}>Nothing planned yet.</Text>
              <Button label="Find a booking" onPress={() => r.navigate('/bookings' as never)} style={{ height: 46 }} />
            </View>
          )}
        </Enter>
        {plans.length > 1 ? (
          <Enter index={1} style={{ marginTop: 14 }}>
            <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} onScroll={onCarousel} scrollEventThrottle={16} snapToInterval={CARD + GAP} decelerationRate="fast"
              style={{ flexGrow: 0, marginHorizontal: -22 }} contentContainerStyle={{ paddingHorizontal: 22 }}>
              {plans.slice(1).map((p, i) => <PlanCard key={`${p.kind}${p.id}`} p={p} i={i} x={x} onPress={() => openPlan(p)} />)}
            </Animated.ScrollView>
          </Enter>
        ) : null}

        {lobbies.length ? (<Enter index={2}>
          <Heading title="Your lobbies" action="All" onAction={() => r.navigate('/channels' as never)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginHorizontal: -22 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 16 }}>
            {lobbies.map((c) => (
              <PressScale key={c.id} accessibilityRole="button" accessibilityLabel={c.name} onPress={() => r.push({ pathname: '/channel/[id]', params: { id: c.id } })} style={{ alignItems: 'center', width: 76 }}>
                <View>
                  <RingBadge name={c.name} activity={c.interest_name} photo={c.library_photo} unread={!!unread.byChannel[c.id]} size={64} />
                  {unread.byChannel[c.id] ? <View style={{ position: 'absolute', top: -4, right: -6, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.inkOn }}>{unread.byChannel[c.id]}</Text></View> : null}
                </View>
                <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink, marginTop: 6 }}>{c.name.split(/[ /&]/)[0]}</Text>
              </PressScale>
            ))}
          </ScrollView>
        </Enter>) : null}

        {soon.length ? (<>
          <Heading title="Starting soon" action="See all" onAction={() => r.navigate('/bookings' as never)} />
          {soon.map((b, i) => (
            <Enter key={b.id} index={3 + i} style={{ marginBottom: 14 }}>
              <PhotoCard photoPath={b.photo_path} activity={b.interest_name} height={200} radius={24} label={b.title} onPress={() => r.push({ pathname: '/booking/[id]', params: { id: b.id } })}
                top={spots(b).left ? <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(250,248,244,0.94)', borderRadius: 14, paddingHorizontal: 11, height: 28 }}>{urgent(b) ? <PulseDot size={6} color="#1b1a18" /> : null}<Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#1b1a18' }}>{spots(b).left}</Text></View> : null}>
                <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 24, lineHeight: 28, color: '#faf8f4' }}>{b.title}</Text>
                <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 13.5, color: 'rgba(250,248,244,0.9)', marginTop: 4 }}>{bookingDay(b.starts_at)}, {timeRange(b.starts_at, b.ends_at).split(' to ')[0]}{b.area ? `  ·  ${b.area}` : ''}</Text>
              </PhotoCard>
            </Enter>
          ))}
        </>) : null}

        {featured ? (<Enter index={7}>
          <Heading title="Events" action="All events" onAction={() => r.navigate('/events' as never)} />
          <FeaturedEvent e={featured} onPress={() => r.push({ pathname: '/event/[id]', params: { id: featured.id } })} />
        </Enter>) : null}

        {chats.length ? (<>
          <Heading title="Pick up where you left off" action="All chats" onAction={() => r.navigate('/channels' as never)} />
          {chats.map((c) => (
            <Row key={c.key} unread={c.n} left={c.dm ? <WithDot on><PersonAvatar person={c.dm} size={52} /></WithDot> : <RingBadge name={c.ch!.name} activity={c.ch!.interest_name} photo={c.ch!.library_photo} unread size={52} />}
              title={c.title} subtitle={c.sub} meta={c.at ? listStamp(c.at) : null} onPress={c.go} />
          ))}
        </>) : null}
      </>) : null}
    </Animated.ScrollView>
  );
}

export default function Home() {
  const city = useCity();
  return city.live ? <HomeInner /> : <NotLive />;
}
