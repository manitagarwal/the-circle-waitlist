import React from 'react';
import { Text, View } from 'react-native';
import { PhotoCard } from './PhotoCard';
import { colors, fonts } from '@/theme';
import type { EventRow } from '@/lib/api';
import { bookingDay, timeRange } from '@/lib/bookings';
import { priceText, spotsText } from '@/lib/events';
import { useSignedUrl } from '@/lib/media';

const STATUS: Record<string, string> = { going: "You're going", waitlist: 'On the waitlist', attended: 'You came', no_show: 'Missed' };

export function EventCard({ e, onPress }: { e: EventRow; onPress: () => void }) {
  const cover = useSignedUrl(e.cover_path, 'event-covers');
  const mine = e.status === 'cancelled' ? 'Cancelled' : e.my_status ? (e.my_status === 'waitlist' && e.my_position ? `Waitlist #${e.my_position}` : STATUS[e.my_status]) : null;
  return (
    <View style={{ marginBottom: 16 }}>
      <PhotoCard uri={cover} activity={e.interest_name} height={250} onPress={onPress} label={e.title}
        top={<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: 'rgba(250,248,244,0.92)', borderRadius: 14, paddingHorizontal: 11, height: 28, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#1b1a18' }}>{priceText(e.price_inr)}</Text></View>
          {mine ? <View style={{ backgroundColor: 'rgba(27,26,24,0.85)', borderRadius: 14, paddingHorizontal: 11, height: 28, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodySemi, fontSize: 12.5, color: '#faf8f4' }}>{mine}</Text></View> : null}
        </View>}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11.5, letterSpacing: 1.4, color: 'rgba(250,248,244,0.8)' }}>{(e.interest_name ?? 'The Semi Circle').toUpperCase()}</Text>
        <Text numberOfLines={2} style={{ fontFamily: fonts.title, fontSize: 26, lineHeight: 31, color: '#faf8f4', marginTop: 4 }}>{e.title}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(250,248,244,0.9)', marginTop: 4 }}>{bookingDay(e.starts_at)}, {timeRange(e.starts_at, e.ends_at)}  ·  {[e.venue_name, e.area ?? e.city].filter(Boolean).join(', ')}</Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: 'rgba(250,248,244,0.8)', marginTop: 4 }}>{spotsText(e)}</Text>
      </PhotoCard>
    </View>
  );
}
