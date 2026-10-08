import type { NotificationRow } from './api';
import { clock } from './format.ts';

export type ActivityView = {
  title: string; body: string | null; from?: string; actions?: 'friend'; fromId?: string;
  go?: { to: 'channels' | 'bookings' | 'messages' | 'booking' | 'events'; id?: string; tab?: string };
};

const MODERATION: Record<string, string> = {
  warning: "You've received a warning from the team.",
  suspension: 'Your account is suspended for now.',
  ban: 'Your account has been closed.',
  restriction_lifted: 'Your restriction has been lifted.',
  suspension_ended: 'Your suspension has ended.',
};

/** Turns a stored notification into the words and action shown in the Activity list. */
export function describe(n: NotificationRow): ActivityView {
  const p = n.payload ?? {};
  switch (n.type) {
    case 'friend_request':
      return p.via === 'dm'
        ? { title: `${p.from_username} sent you a message.`, body: null, go: { to: 'messages' } }
        : { title: `${p.from_username} wants to be friends.`, body: p.message || null, actions: 'friend', fromId: p.from_id };
    case 'booking_join':
      return { title: `${p.member_username} joined your booking ${p.title}.`, body: null, go: { to: 'booking', id: p.booking_id } };
    case 'booking_reminder':
      return { title: `Your booking starts in an hour. ${p.title}${p.starts_at ? `, ${clock(new Date(p.starts_at))}` : ''}.`, body: null, go: { to: 'booking', id: p.booking_id } };
    case 'booking_cancelled':
      return { title: `${p.title} was cancelled by the host.`, body: 'Its chat closes tomorrow.', go: { to: 'bookings' } };
    case 'event_update':
      return p.kind === 'promoted'
        ? { title: `A spot opened up. You're going to ${p.title}.`, body: null, go: { to: 'events', id: p.event_id } }
        : { title: `${p.title} was cancelled.`, body: 'Sorry about that. Nothing is owed on your side.', go: { to: 'events', id: p.event_id } };
    case 'group_added':
      return { title: `${p.by_username} added you to ${p.channel_name}.`, body: null, go: { to: 'messages', tab: 'groups' } };
    case 'channel_invite':
      return { title: `You've been invited to ${p.channel_name}.`, body: "It's in Messages, under Groups.", go: { to: 'channels' } };
    case 'broadcast':
      return { title: p.title ?? 'Announcement', body: p.body ?? null, from: 'The Semi Circle' };
    case 'moderation_notice':
      return { title: MODERATION[p.action] ?? 'A message from the team.', body: null, from: 'The Semi Circle' };
    default:
      return { title: 'Something happened.', body: null };
  }
}
