import React, { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Bar } from '@/components/Bar';
import { Cover } from '@/components/Cover';
import { PersonAvatar } from '@/components/Avatar';
import { SectionLabel, Sheet, State } from '@/components/lists';
import { Body, Button, Notice, TextField } from '@/components/ui';
import { PressScale } from '@/components/motion';
import { TicketQr } from '@/components/TicketQr';
import { colors, fonts, radius } from '@/theme';
import { api } from '@/lib/auth';
import { buyTicket, cancelPaidTicket } from '@/lib/payments';
import { bookingDay, timeRange } from '@/lib/bookings';
import { eventCta, eventFit, eventRules, priceText, spotsText } from '@/lib/events';
import { clock } from '@/lib/format';
import { interestIndex, loadInterestGroups } from '@/lib/interests';
import { useSignedUrl } from '@/lib/media';
import { friendly } from '@/lib/messages';
import { useLoad } from '@/lib/useLoad';
import { Info } from '@/components/Info';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [promo, setPromo] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const { data, error, loading, reload } = useLoad(async () => {
    const event = await api.event(id);
    if (!event) return { event: null };
    const paid = event.price_inr > 0;
    const [roster, ticket, me, groups, tickets, refund] = await Promise.all([
      api.eventRoster(id).catch(() => []), event.my_status === 'going' || event.my_status === 'attended' ? api.myTicket(id).catch(() => null) : Promise.resolve(null),
      api.myProfileBasics(), loadInterestGroups(() => api.interestGroups()).catch(() => []),
      paid && !event.my_status ? api.eventTickets(id).catch(() => []) : Promise.resolve([]),
      paid && event.my_status === 'going' ? api.refundPreview(id).catch(() => null) : Promise.resolve(null),
    ]);
    return { event, roster, ticket, me, tickets, refund, group: event.interest_id ? interestIndex(groups).get(event.interest_id)?.group ?? null : null };
  }, [id]);
  const e = data?.event ?? null;
  const cover = useSignedUrl(e?.cover_path, 'event-covers');

  const act = async (fn: () => Promise<unknown>) => { setBusy(true); setErr(null); try { await fn(); await reload(); } catch (x) { setErr(friendly(x)); } finally { setBusy(false); setConfirm(false); } };

  const buy = async (ticketId: string) => {
    setBusy(true); setErr(null); setNote(null);
    try {
      const r = await buyTicket(id, ticketId, promo);
      if (r === 'oversold') setNote('That ticket sold out while you were paying. Your money is on its way back to you.');
      else if (r === 'failed') setErr('The payment did not go through. You have not been charged. Try again.');
      await reload();
    } catch (x) { setErr(friendly(x)); await reload().catch(() => {}); } finally { setBusy(false); }
  };
  const cancelPaid = async () => {
    setBusy(true); setErr(null);
    try {
      const back = await cancelPaidTicket(id);
      setNote(back > 0 ? `Cancelled. ₹${back} is on its way back to you, usually in 5 to 7 days.` : 'Cancelled. This one is no longer refundable.');
      await reload();
    } catch (x) { setErr(friendly(x)); } finally { setBusy(false); setConfirm(false); }
  };

  let body: React.ReactNode = <State loading={loading} error={error} onRetry={reload} />;
  if (data && !e) body = <State empty="That event isn't available." />;
  if (data && e && 'roster' in data) {
    const { roster, ticket, me, group, tickets, refund } = data as Required<typeof data> & { event: NonNullable<typeof e> };
    const cta = eventCta(e);
    const rules = eventRules(e);
    const why = e.my_status ? null : eventFit(e, me);
    const late = new Date(e.starts_at).getTime() - Date.now() < 3 * 3600000;
    body = (<>
      <View style={{ marginBottom: 18 }}><Cover uri={cover} activity={e.interest_name} height={220} /></View>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 1.4, color: colors.faint }}>{[group, e.interest_name].filter(Boolean).join(' · ').toUpperCase() || 'THE SEMI CIRCLE'}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 37, lineHeight: 41, color: colors.ink, marginTop: 6 }}>{e.title}</Text>
      {e.status === 'cancelled' ? <Notice tone="error">This event was cancelled.</Notice> : null}

      <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.line }}>
        <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{bookingDay(e.starts_at)}, {timeRange(e.starts_at, e.ends_at)}</Text>
        </View>
        <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{[e.venue_name, e.area ?? e.city].filter(Boolean).join(', ') || 'Venue to be announced'}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{e.address_text ?? "The exact address appears once you've reserved a spot."}</Text>
        </View>
        <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>{priceText(e.price_inr)}</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted }}>{spotsText(e)}</Text>
        </View>
      </View>

      {e.description ? <Body style={{ marginTop: 16 }}>{e.description}</Body> : null}
      {rules.length ? (<><SectionLabel>Who it's for</SectionLabel>{rules.map((r) => <Text key={r} style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink, marginBottom: 4 }}>• {r}</Text>)}</>) : null}

      {roster.length ? (<><SectionLabel>Who's going</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {roster.slice(0, 24).map((p) => (
            <View key={p.member_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12, backgroundColor: colors.surface, borderRadius: 24 }}>
              <PersonAvatar person={p} size={32} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink }}>{p.username}</Text>
            </View>))}
        </View>
        {roster.length > 24 ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.faint, marginTop: 6 }}>and {roster.length - 24} more</Text> : null}</>) : null}

      {ticket ? (
        <View style={{ marginTop: 20, alignItems: 'center', padding: 20, backgroundColor: colors.surface, borderRadius: 24 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 1.4, color: colors.faint }}>YOUR TICKET</Text>
          <View style={{ marginTop: 10 }}><TicketQr code={ticket} /></View>
          <Text selectable style={{ fontFamily: fonts.display, fontSize: 32, letterSpacing: 5, color: colors.ink, marginTop: 12 }}>{ticket}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' }}>Show this at the door. Doors open at {clock(new Date(e.starts_at))}.</Text>
        </View>) : null}

      {err ? <Notice tone="error">{err}</Notice> : null}
      {note ? <Notice tone="plain">{note}</Notice> : null}
      <View style={{ marginTop: 20, gap: 10 }}>
        {cta === 'reserve' ? <Button label="Reserve my spot" onPress={() => act(() => api.rsvp(id))} loading={busy} disabled={!!why} /> : null}
        {cta === 'waitlist' ? <Button label="Join the waitlist" onPress={() => act(() => api.rsvp(id))} loading={busy} disabled={!!why} /> : null}
        {cta === 'paid' && tickets.length ? (<>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.8, color: colors.faint, marginTop: 6 }}>CHOOSE A TICKET</Text>
          {tickets.map((t) => {
            const on = (pick ?? tickets.find((x) => x.left !== 0)?.id) === t.id;
            const out = t.left === 0;
            return (
              <PressScale key={t.id} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: out }} disabled={out} onPress={() => setPick(t.id)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: on ? colors.ink : colors.line, backgroundColor: on ? colors.surface : 'transparent', opacity: out ? 0.45 : 1 }}>
                <View>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink }}>{t.name}</Text>
                  {out ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 }}>Sold out</Text> : t.left != null && t.left <= 10 ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 }}>{t.left} left</Text> : null}
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>{priceText(t.price_inr)}</Text>
              </PressScale>
            );
          })}
          {promoOpen ? <TextField label="Promo code" value={promo} onChangeText={(v) => setPromo(v.toUpperCase())} autoCapitalize="characters" autoCorrect={false} />
            : <Text accessibilityRole="button" onPress={() => setPromoOpen(true)} style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, textDecorationLine: 'underline', textAlign: 'center', paddingVertical: 8 }}>Have a promo code?</Text>}
          {(() => {
            const chosen = tickets.find((t) => t.id === (pick ?? tickets.find((x) => x.left !== 0)?.id));
            return <Button label={chosen ? `Pay ${priceText(chosen.price_inr)}` : 'Sold out'} onPress={() => chosen && buy(chosen.id)} loading={busy} disabled={!chosen || chosen.left === 0 || !!why} />;
          })()}
        </>) : null}
        {cta === 'paid' && !tickets.length ? <Button label="Tickets are not on sale" onPress={() => {}} disabled /> : null}
        {cta === 'cancel' || cta === 'cancel_waitlist' ? <Button label={cta === 'cancel' ? 'Cancel my spot' : 'Leave the waitlist'} variant="secondary" onPress={() => setConfirm(true)} /> : null}
        {why && (cta === 'reserve' || cta === 'waitlist' || cta === 'paid') ? <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.error, textAlign: 'center' }}>{why}</Text> : null}
        {e.my_status === 'waitlist' && e.my_position ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted, textAlign: 'center' }}>You're number {e.my_position} on the waitlist. We'll tell you if a spot opens.</Text> : null}
        {cta === 'over' ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, textAlign: 'center' }}>This event has finished.</Text> : null}
      </View>
      {cta === 'cancel' ? <Info text={"You can cancel any time before it starts. Cancelling in the last 3 hours counts against your reliability score."} /> : null}
      <Sheet visible={confirm} onClose={() => setConfirm(false)} title={cta === 'cancel' ? 'Cancel your spot?' : 'Leave the waitlist?'}>
        <Body style={{ marginBottom: 16 }}>{cta === 'cancel' && refund && refund.paid_inr > 0 ? `You paid ₹${refund.paid_inr}. Cancelling now returns ₹${refund.refund_inr}${refund.percent < 100 ? ` (${refund.percent}%)` : ''}.${late ? ' It also counts against your reliability score.' : ''}` : cta === 'cancel' ? (late ? 'The event is close, so cancelling now counts against your reliability score.' : 'Your spot goes to the next person on the waitlist.') : "You'll lose your place in the queue."}</Body>
        <View style={{ gap: 8 }}><Button label={cta === 'cancel' ? 'Cancel my spot' : 'Leave the waitlist'} loading={busy} onPress={() => (cta === 'cancel' && refund && refund.paid_inr > 0 ? cancelPaid() : act(() => api.cancelRsvp(id)))} /><Button label="Keep it" variant="link" onPress={() => setConfirm(false)} /></View>
      </Sheet>
    </>);
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      <Bar title="Event" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>{body}</ScrollView>
    </View>
  );
}
