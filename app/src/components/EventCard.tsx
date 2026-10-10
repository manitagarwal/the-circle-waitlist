import React from 'react';
import { Text, View } from 'react-native';
import { PressScale } from './motion';
import { Cover } from './Cover';
import { colors, fonts } from '@/theme';
import type { EventRow } from '@/lib/api';
import { bookingDay, timeRange } from '@/lib/bookings';
import { isFull, priceText, spotsText } from '@/lib/events';
import { useSignedUrl } from '@/lib/media';

const STATUS: Record<string, string> = { going: "You're going", waitlist: 'On the waitlist', attended: 'You came', no_show: 'Missed' };

export function EventCard({ e, onPress }: { e: EventRow; onPress: () => void }) {
  const cover = useSignedUrl(e.cover_path, 'event-covers');
  const mine = e.status === 'cancelled' ? 'Cancelled' : e.my_status ? (e.my_status === 'waitlist' && e.my_position ? `Waitlist #${e.my_position}` : STATUS[e.my_status]) : null;
  return (
    <PressScale accessibilityRole="button" onPress={onPress} scaleTo={0.985} style={{ marginBottom: 26 }}>
      <Cover uri={cover} activity={e.interest_name} height={170} />
      <View style={{ paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 1.4, color: colors.faint }}>{(e.interest_name ?? 'The Semi Circle').toUpperCase()}</Text>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>{priceText(e.price_inr)}</Text>
        </View>
        <Text style={{ fontFamily: fonts.title, fontSize: 24, color: colors.ink, marginTop: 4 }}>{e.title}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 2 }}>{bookingDay(e.starts_at)}, {timeRange(e.starts_at, e.ends_at)}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.muted }}>{[e.venue_name, e.area ?? e.city].filter(Boolean).join(', ')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: isFull(e) ? colors.clay : colors.muted }}>{spotsText(e)}</Text>
          {mine ? <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: e.status === 'cancelled' ? colors.error : colors.sage }}>{mine}</Text> : null}
        </View>
      </View>
    </PressScale>
  );
}
