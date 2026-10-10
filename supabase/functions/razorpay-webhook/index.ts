// Razorpay tells us about payments here. It is the safety net for when the member never returns to the app after paying.
// Set it up in Razorpay: Settings > Webhooks > add this function's URL, secret = RAZORPAY_WEBHOOK_SECRET, events payment.captured, payment.failed.
import { createClient } from 'npm:@supabase/supabase-js@2';

const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? '';
const paise = (inr: number) => Math.round(Number(inr) * 100);
const ok = (b: unknown = { ok: true }, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const same = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
async function rz(path: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`), 'content-type': 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.description ?? `razorpay_${r.status}`);
  return j;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return ok({ error: 'method_not_allowed' }, 405);
  if (!SECRET) return ok({ error: 'not_configured' }, 503);
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') ?? '';
  if (!same(await hmacHex(SECRET, raw), sig)) return ok({ error: 'signature_invalid' }, 400);
  try {
    const ev = JSON.parse(raw);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const pay = ev?.payload?.payment?.entity;
    if (!pay?.order_id) return ok({ ignored: true });

    if (ev.event === 'payment.failed') { await db.rpc('fail_event_payment', { p_order: pay.order_id }); return ok(); }

    if (ev.event === 'payment.captured') {
      const { data: row } = await db.from('event_payments').select('amount_inr').eq('razorpay_order_id', pay.order_id).maybeSingle();
      if (!row || pay.amount !== paise(row.amount_inr) || pay.currency !== 'INR') return ok({ ignored: true });
      const { data: c, error } = await db.rpc('confirm_event_payment', { p_order: pay.order_id, p_rzp_payment: pay.id, p_method: pay.method ?? null });
      if (error) throw error;
      if (c.result === 'oversold') {
        try { const rf = await rz(`/payments/${pay.id}/refund`, { method: 'POST', body: JSON.stringify({ amount: pay.amount, speed: 'normal' }) }); await db.rpc('mark_refund', { p_payment: c.payment_id, p_refund: rf.id, p_amount: c.amount_inr }); }
        catch (e) { console.error('oversold refund failed', String(e)); }
      }
      return ok();
    }
    return ok({ ignored: true });
  } catch (e) {
    console.error(String(e));
    return ok({ error: 'server_error' }, 500);   // Razorpay will try again
  }
});
