// Emails an applicant to say they have been accepted. Called by the admin portal right after "Accept".
// Needs the secret RESEND_API_KEY (Edge Functions > Secrets). MAIL_FROM is optional.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const serif = "'Fraunces','Iowan Old Style',Palatino,Georgia,serif";
const page = (name: string, email: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
</head><body style="margin:0;background:#f6f1e7;font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;color:#1b1a18">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Most people don't. You did.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:28px 16px"><tr><td align="center">
<table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%">
<tr><td style="padding:0 4px 18px"><img src="https://thesemicircle.in/email-logo.png" alt="The Semi Circle" width="96" style="max-width:96px;height:auto;display:block"></td></tr>
<tr><td style="background:#1b1a18;border-radius:22px 22px 0 0;padding:34px 28px 28px">
<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#b9ad96;margin:0 0 10px">Application accepted</div>
<h1 style="font-family:${serif};font-weight:600;font-size:34px;line-height:1.15;margin:0;color:#f6f1e7">You're in, ${esc(name)}.</h1>
</td></tr>
<tr><td style="background:#fffdf8;border-radius:0 0 22px 22px;padding:28px 28px 30px">
<p style="font-size:16px;line-height:1.6;margin:0 0 18px;color:#3d3a34">Most people don't get in. That was the whole idea. You did, so somebody read your application and thought: yes, this one shows up.</p>
<p style="font-family:${serif};font-size:18px;font-weight:600;margin:0 0 8px;color:#1b1a18">Three steps. Less time than a Delhi traffic light.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td style="font-family:${serif};font-size:20px;font-weight:600;color:#76582a;padding:6px 14px 6px 0;vertical-align:top">1</td><td style="font-size:15px;line-height:1.55;color:#3d3a34;padding:6px 0">Open The Semi Circle app.</td></tr>
<tr><td style="font-family:${serif};font-size:20px;font-weight:600;color:#76582a;padding:6px 14px 6px 0;vertical-align:top">2</td><td style="font-size:15px;line-height:1.55;color:#3d3a34;padding:6px 0">Sign in with <b style="font-weight:500;color:#1b1a18">${esc(email)}</b>.</td></tr>
<tr><td style="font-family:${serif};font-size:20px;font-weight:600;color:#76582a;padding:6px 14px 6px 0;vertical-align:top">3</td><td style="font-size:15px;line-height:1.55;color:#3d3a34;padding:6px 0">Pick a username and what you're into. Then join a plan, a channel or an event.</td></tr></table>
<p style="font-size:16px;line-height:1.6;margin:0 0 18px;color:#3d3a34">One small house rule: say yes, then show up. Your reliability score will remember.</p>
<p style="font-size:14px;line-height:1.6;margin:0;color:#7a7365">Didn't apply to The Semi Circle? Ignore this email and nothing happens.</p>
</td></tr>
<tr><td style="padding:16px 4px 0;font-size:12px;line-height:1.6;color:#948b79">See you at the next plan.<br>The Semi Circle. Most people won't get in. That's the point.</td></tr>
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
      body: JSON.stringify({ from: Deno.env.get('MAIL_FROM') ?? 'The Semi Circle <hello@thesemicircle.in>', to: [a.personal_email], subject: "You're in. Yes, really.", html: page(first, a.personal_email) }),
    });
    if (!r.ok) return json({ error: 'email_failed', detail: (await r.text()).slice(0, 300) }, 502);
    await db.from('applicants').update({ acceptance_emailed_at: new Date().toISOString() }).eq('id', a.id);
    return json({ sent: true });
  } catch (e) {
    return json({ error: 'server_error', detail: String(e).slice(0, 200) }, 500);
  }
});
