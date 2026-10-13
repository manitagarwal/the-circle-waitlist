// Contact form on thesemicircle.in/contact. Saves the message and emails it to hello@thesemicircle.in.
// Public (no login). Needs RESEND_API_KEY (same secret as send-acceptance). MAIL_FROM and CONTACT_TO are optional.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const TOPICS: Record<string, string> = { hello: 'Just saying hello', apply: 'About my application', plans: 'Plans, events or venues', partner: 'Partnerships', press: 'Press', bug: 'Something is broken', other: 'Something else' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'bad_request' }, 405);
  try {
    const b = await req.json();
    if (b.website) return json({ sent: true }); // honeypot: bots fill this, people never see it
    const name = String(b.name ?? '').trim().slice(0, 80);
    const email = String(b.email ?? '').trim().toLowerCase().slice(0, 120);
    const message = String(b.message ?? '').trim().slice(0, 4000);
    const topic = TOPICS[String(b.topic)] ? String(b.topic) : 'hello';
    if (!name) return json({ error: 'name' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'email' }, 400);
    if (message.length < 5) return json({ error: 'message' }, 400);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count: mine } = await db.from('contact_messages').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', since);
    const { count: all } = await db.from('contact_messages').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if ((mine ?? 0) >= 3 || (all ?? 0) >= 40) return json({ error: 'slow_down' }, 429);

    const { error } = await db.from('contact_messages').insert({ name, email, topic, message });
    if (error) return json({ error: 'server_error' }, 500);

    const key = Deno.env.get('RESEND_API_KEY');
    if (key) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: Deno.env.get('MAIL_FROM') ?? 'The Semi Circle <hello@thesemicircle.in>',
          to: [Deno.env.get('CONTACT_TO') ?? 'hello@thesemicircle.in'],
          reply_to: email,
          subject: `Contact: ${TOPICS[topic]} (${name})`,
          html: `<p><b>${esc(name)}</b> &lt;${esc(email)}&gt;<br>${esc(TOPICS[topic])}</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
        }),
      }).catch(() => {}); // the message is already saved; the email is a bonus
    }
    return json({ sent: true });
  } catch (_e) {
    return json({ error: 'server_error' }, 500);
  }
});
