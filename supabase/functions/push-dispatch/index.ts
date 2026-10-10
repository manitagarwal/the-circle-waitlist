// Sends the phone alert for every new notification, once. Runs every minute from a database job (secret in the vault)
// and is also called by the admin portal right after a notification is sent.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-push-secret' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });

const MODERATION: Record<string, string> = {
  warning: "You've received a warning from the team.", suspension: 'Your account is suspended for now.', ban: 'Your account has been closed.',
  restriction_lifted: 'Your restriction has been lifted.', suspension_ended: 'Your suspension has ended.',
};
type N = { id: string; member_id: string; type: string; payload: Record<string, any> | null; send_push: boolean };

// the words on the phone: the same as the Activity list in the app
function render(n: N): { title: string; body: string | null } | null {
  const p = n.payload ?? {};
  switch (n.type) {
    case 'friend_request': return p.via === 'dm' ? { title: `${p.from_username} sent you a message.`, body: null } : { title: `${p.from_username} wants to be friends.`, body: p.message || null };
    case 'booking_join': return { title: `${p.member_username} joined your booking.`, body: p.title ?? null };
    case 'booking_reminder': return { title: 'Your booking starts in an hour.', body: p.title ?? null };
    case 'booking_cancelled': return { title: `${p.title} was cancelled by the host.`, body: 'Its chat closes tomorrow.' };
    case 'event_update': return p.kind === 'promoted' ? { title: 'A spot opened up.', body: `You're going to ${p.title}.` } : { title: `${p.title} was cancelled.`, body: 'Sorry about that. Nothing is owed on your side.' };
    case 'group_added': return { title: `${p.by_username} added you to ${p.channel_name}.`, body: null };
    case 'channel_invite': return { title: `You've been invited to ${p.channel_name}.`, body: null };
    case 'broadcast': return { title: p.title ?? 'Announcement', body: p.body || null };
    case 'moderation_notice': return { title: MODERATION[p.action] ?? 'A message from the team.', body: null };
    default: return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // who is calling: the database job (secret) or a signed-in admin
    const secret = req.headers.get('x-push-secret');
    let ok = false;
    if (secret) { const { data } = await db.rpc('push_secret_ok', { p: secret }); ok = data === true; }
    else {
      const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
      const { data } = await asUser.rpc('is_admin'); ok = data === true;
    }
    if (!ok) return json({ error: 'not_allowed' }, 403);

    // anything older than two hours is stale: mark it done without sending
    const cutoff = new Date(Date.now() - 2 * 3600e3).toISOString();
    await db.from('notifications').update({ pushed_at: new Date().toISOString() }).is('pushed_at', null).lt('created_at', cutoff);

    const { data: pending } = await db.from('notifications').select('id').is('pushed_at', null).order('created_at').limit(500);
    const ids = (pending ?? []).map((r) => r.id);
    if (!ids.length) return json({ claimed: 0, sent: 0 });
    // claim them, so two runs at once can never send the same one twice
    const { data: claimed } = await db.from('notifications').update({ pushed_at: new Date().toISOString() }).in('id', ids).is('pushed_at', null).select('id, member_id, type, payload, send_push');
    const rows = ((claimed ?? []) as N[]).filter((n) => n.send_push);
    if (!rows.length) return json({ claimed: claimed?.length ?? 0, sent: 0 });

    const members = [...new Set(rows.map((n) => n.member_id))];
    const [{ data: tokens }, { data: off }] = await Promise.all([
      db.from('push_tokens').select('member_id, token').in('member_id', members),
      db.from('notification_prefs').select('member_id, category').in('member_id', members).eq('enabled', false),
    ]);
    const tokensBy = new Map<string, string[]>();
    for (const t of tokens ?? []) tokensBy.set(t.member_id, [...(tokensBy.get(t.member_id) ?? []), t.token]);
    const muted = new Set((off ?? []).map((o) => `${o.member_id}:${o.category}`));

    const imageUrl = new Map<string, string | null>();
    const signed = async (path: string) => {
      if (!imageUrl.has(path)) { const { data } = await db.storage.from('announcement-images').createSignedUrl(path, 7 * 86400); imageUrl.set(path, data?.signedUrl ?? null); }
      return imageUrl.get(path)!;
    };

    const msgs: Record<string, unknown>[] = [];
    const owner: string[] = [];
    for (const n of rows) {
      if (n.type !== 'moderation_notice' && muted.has(`${n.member_id}:${n.type}`)) continue; // account notices always come through
      const text = render(n);
      const toks = tokensBy.get(n.member_id);
      if (!text || !toks?.length) continue;
      const image = n.type === 'broadcast' && n.payload?.image_path ? await signed(n.payload.image_path) : null;
      for (const to of toks) {
        msgs.push({ to, title: text.title, body: text.body ?? undefined, sound: 'default', priority: 'high', data: { type: n.type, id: n.id }, ...(image ? { richContent: { image } } : {}) });
        owner.push(to);
      }
    }

    let sent = 0, removed = 0;
    for (let i = 0; i < msgs.length; i += 100) {
      const chunk = msgs.slice(i, i + 100);
      const r = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify(chunk) });
      if (!r.ok) continue;
      const { data: tickets } = await r.json();
      (tickets ?? []).forEach((t: any, k: number) => {
        if (t.status === 'ok') sent++;
        else if (t.details?.error === 'DeviceNotRegistered') { removed++; void db.from('push_tokens').delete().eq('token', owner[i + k]); }
      });
    }
    return json({ claimed: claimed?.length ?? 0, attempted: msgs.length, sent, removed });
  } catch (e) {
    return json({ error: 'server_error', detail: String(e).slice(0, 200) }, 500);
  }
});
