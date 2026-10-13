// Emails an applicant to say they have been accepted. Called by the admin portal right after "Accept".
// Needs the secret RESEND_API_KEY (Edge Functions > Secrets). MAIL_FROM is optional.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const serif = "'Newsreader','Iowan Old Style',Palatino,Georgia,serif";
const page = (name: string, email: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
</head><body style="margin:0;background:#f4efe4;font-family:${serif};color:#25211b">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">A real person read your application.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe4;padding:36px 20px"><tr><td align="center">
<table role="presentation" width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%">
<tr><td style="padding:0 0 26px"><img src="https://thesemicircle.in/email-logo.png" alt="The Semi Circle" width="84" style="max-width:84px;height:auto;display:block"></td></tr>
<tr><td style="font-size:19px;line-height:1.65;color:#25211b">
<p style="margin:0 0 20px">Hi ${esc(name)},</p>
<p style="margin:0 0 20px">Good news. A real person read your application, and you're in.</p>
<p style="margin:0 0 20px">To get started, open the app and sign in with <span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:15px;background:#e9e1cf;padding:2px 6px;border-radius:4px;word-break:break-all">${esc(email)}</span>. It will ask you to pick a username and a few things you like doing. After that you can join a plan, wander into a channel, or book yourself a seat at an event.</p>
<p style="margin:0 0 20px">There is only one house rule. If you say yes to a plan, turn up. We keep a quiet score of who does, and it makes everyone's weekends better.</p>
<p style="margin:0 0 28px">Welcome. We're glad it's you.</p>
<p style="margin:0 0 4px;font-style:italic">The Semi Circle team</p>
</td></tr>
<tr><td style="padding:34px 0 0;font-size:13px;line-height:1.6;color:#8b8372;border-top:1px solid #ded5c0;margin-top:30px">Got this by mistake? Ignore it and nothing happens.</td></tr>
</table></td></tr></table></body></html>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
    const { data: isAdmin } = await asUser.rpc('is_admin');
    if (!isAdmin) return json({ error: 'not_allowed' }, 403);

    const { applicant_id, resend } = await req.json();
    if (typeof applicant_id !== 'string') return json({ error: 'bad_request' }, 400);
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: a } = await db.from('applicants').select('id, full_name, personal_email, status, acceptance_emailed_at').eq('id', applicant_id).maybeSingle();
    if (!a) return json({ error: 'applicant_not_found' }, 404);
    if (a.status !== 'accepted') return json({ error: 'not_accepted' }, 400);
    if (a.acceptance_emailed_at && !resend) return json({ sent: false, already: true });

    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) return json({ error: 'email_not_configured' }, 500);
    const first = (a.full_name || '').trim().split(/\s+/)[0] || 'there';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: Deno.env.get('MAIL_FROM') ?? 'The Semi Circle <hello@thesemicircle.in>', to: [a.personal_email], subject: "You're in", html: page(first, a.personal_email) }),
    });
    if (!r.ok) return json({ error: 'email_failed', detail: (await r.text()).slice(0, 300) }, 502);
    await db.from('applicants').update({ acceptance_emailed_at: new Date().toISOString() }).eq('id', a.id);
    return json({ sent: true });
  } catch (e) {
    return json({ error: 'server_error', detail: String(e).slice(0, 200) }, 500);
  }
});
