// Emails an applicant to say they have been accepted. Called by the admin portal right after "Accept".
// Needs the secret RESEND_API_KEY (Edge Functions > Secrets). MAIL_FROM is optional.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const page = (name: string) => `<!doctype html><html><body style="margin:0;background:#f3ecdf;font-family:Inter,Arial,sans-serif;color:#211c16">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdf;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #ddd2ba;border-radius:16px">
<tr><td style="padding:32px 32px 8px;text-align:center"><img src="https://thesemicircle.in/email-logo.png" alt="The Semi Circle" width="120" style="max-width:120px;height:auto"></td></tr>
<tr><td style="padding:8px 32px 32px">
<h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;margin:16px 0 12px;text-align:center">You're in, ${esc(name)}.</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 16px">Your application to The Semi Circle has been accepted. Welcome.</p>
<p style="font-size:16px;line-height:1.6;margin:0 0 16px">Open the app and sign in with this email address. You'll set up your profile, pick what you're into, and then you can join channels, book plans and come to our events.</p>
<p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6b6152">If you didn't apply to The Semi Circle, you can ignore this email.</p>
</td></tr></table>
<p style="font-size:12px;color:#8a7f6d;margin:16px 0 0">The Semi Circle, private community</p>
</td></tr></table></body></html>`;

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
      body: JSON.stringify({ from: Deno.env.get('MAIL_FROM') ?? 'The Semi Circle <hello@thesemicircle.in>', to: [a.personal_email], subject: "You're in. Welcome to The Semi Circle", html: page(first) }),
    });
    if (!r.ok) return json({ error: 'email_failed', detail: (await r.text()).slice(0, 300) }, 502);
    await db.from('applicants').update({ acceptance_emailed_at: new Date().toISOString() }).eq('id', a.id);
    return json({ sent: true });
  } catch (e) {
    return json({ error: 'server_error', detail: String(e).slice(0, 200) }, 500);
  }
});
