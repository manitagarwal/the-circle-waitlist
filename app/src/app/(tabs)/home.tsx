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
import { Cover } from '@/components/Cover';
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

/** Your very next plan, big, with a live countdown. */
function NextCard({ p, onPress }: { p: Plan; onPress: () => void }) {
  const bg = toneFor(p.interest, isDark) ?? colors.surface;
  const icon = activityIcon(p.interest);
  const cd = useCountdown(p.startsAt, p.endsAt);
  return (
    <PressScale accessibilityRole="button" accessibilityLabel={`${p.title}, ${cd.text}`} onPress={onPress} scaleTo={0.985} style={{ minHeight: 214, borderRadius: 28, backgroundColor: bg, padding: 22, overflow: 'hidden', justifyContent: 'space-between' }}>
      <LinearGradient colors={isDark ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {icon ? <View style={{ position: 'absolute', right: -6, top: 4, opacity: 0.9 }}><SvgXml xml={icon} width={118} height={118} color={colors.ink} /></View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.ground, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 }}>
        {cd.soon ? <PulseDot size={8} /> : null}
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>{cd.text}</Text>
      </View>
      <View>
        <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 30, lineHeight: 34, color: colors.ink, maxWidth: 270 }}>{p.title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, opacity: 0.75, marginTop: 6 }}>{bookingDay(p.startsAt)}, {timeRange(p.startsAt, p.endsAt).split(' to ')[0]}{p.where ? `  ·  ${p.where}` : ''}</Text>
      </View>
    </PressScale>
  );
}

/** A further plan in the swipe row: the card in the middle grows a little, the ones at the edges recede. */
function PlanCard({ p, i, x, onPress }: { p: Plan; i: number; x: SharedValue<number>; onPress: () => void }) {
  const bg = toneFor(p.interest, isDark) ?? colors.surface;
  const icon = activityIcon(p.interest);
  const a = useAnimatedStyle(() => {
    const d = Math.abs(x.value - i * (CARD + GAP)) / (CARD + GAP);
    return { transform: [{ scale: interpolate(d, [0, 1], [1, 0.94], Extrapolation.CLAMP) }], opacity: interpolate(d, [0, 1], [1, 0.7], Extrapolation.CLAMP) };
  });
  return (
    <Animated.View style={[{ width: CARD, marginRight: GAP }, a]}>
      <PressScale accessibilityRole="button" onPress={onPress} style={{ minHeight: 168, borderRadius: 24, backgroundColor: bg, padding: 18, overflow: 'hidden' }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.ink, opacity: 0.65 }}>{bookingDay(p.startsAt)}, {timeRange(p.startsAt, p.endsAt).split(' to ')[0]}</Text>
        <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 23, lineHeight: 27, color: colors.ink, marginTop: 6, maxWidth: 170 }}>{p.title}</Text>
        {p.where ? <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.ink, opacity: 0.75, marginTop: 6, maxWidth: 190 }}>{p.where}</Text> : null}
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 14 }}>{p.note}</Text>
        {icon ? <View style={{ position: 'absolute', right: -14, bottom: -16, opacity: 0.9 }}><SvgXml xml={icon} width={104} height={104} color={colors.ink} /></View> : null}
      </PressScale>
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

function FeaturedEvent({ e, onPress }: { e: { id: string; title: string; cover_path: string | null; interest_name: string | null; starts_at: string; venue_name: string | null; area: string | null; price_inr: number }; onPress: () => void }) {
  const cover = useSignedUrl(e.cover_path, 'event-covers');
  return (
    <PressScale accessibilityRole="button" onPress={onPress} scaleTo={0.985}>
      <View>
        <Cover uri={cover} activity={e.interest_name} height={170} />
        <View style={{ position: 'absolute', left: 14, top: 14, backgroundColor: colors.ground, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>{bookingDay(e.starts_at)}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12 }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink }}>{e.title}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{[e.venue_name, e.area].filter(Boolean).join(', ')}</Text>
        </View>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' }}>{e.price_inr > 0 ? `from ${priceText(e.price_inr)}` : 'Free'}</Text>
      </View>
    </PressScale>
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
                  <RingBadge name={c.name} activity={c.interest_name} unread={!!unread.byChannel[c.id]} size={64} />
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
            <Enter key={b.id} index={3 + i}><Row left={<LetterBadge name={b.title} activity={b.interest_name} size={52} />} title={b.title} subtitle={`${bookingDay(b.starts_at)}, ${timeRange(b.starts_at, b.ends_at).split(' to ')[0]}${b.area ? `. ${b.area}` : ''}`}
              right={spots(b).left ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: urgent(b) ? colors.ink : colors.line, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 4 }}>{urgent(b) ? <PulseDot size={6} /> : null}<Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink }}>{spots(b).left}</Text></View> : undefined}
              onPress={() => r.push({ pathname: '/booking/[id]', params: { id: b.id } })} /></Enter>
          ))}
        </>) : null}

        {featured ? (<Enter index={7}>
          <Heading title="Events" action="All events" onAction={() => r.navigate('/events' as never)} />
          <FeaturedEvent e={featured} onPress={() => r.push({ pathname: '/event/[id]', params: { id: featured.id } })} />
        </Enter>) : null}

        {chats.length ? (<>
          <Heading title="Pick up where you left off" action="All chats" onAction={() => r.navigate('/channels' as never)} />
          {chats.map((c) => (
            <Row key={c.key} unread={c.n} left={c.dm ? <WithDot on><PersonAvatar person={c.dm} size={52} /></WithDot> : <RingBadge name={c.ch!.name} activity={c.ch!.interest_name} unread size={52} />}
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
