// Event payments with Razorpay. One function, four actions (POST ?action=...), all called by a signed-in member or admin:
//   create    start buying a ticket: the database checks everything and prices it, we create the Razorpay order
//   verify    after checkout: check Razorpay's signature and the payment itself, then give the member their spot
//   cancel    cancel a paid ticket: the database applies the event's refund rules, we send the refund to Razorpay
//   refund    (admins) refund one payment, or every paid ticket of an event
// Needs the secrets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET. Prices and amounts always come from the database, never from the app.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });
const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
const paise = (inr: number) => Math.round(Number(inr) * 100);

async function rz(path: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`), 'content-type': 'application/json' } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.description ?? `razorpay_${r.status}`);
  return j;
}
async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const same = (a: string, b: string) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    if (!KEY_ID || !KEY_SECRET) return json({ error: 'payments_not_configured' }, 503);
    const url = Deno.env.get('SUPABASE_URL')!;
    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const me = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
    const { data: u } = await me.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return json({ error: 'not_signed_in' }, 401);
    const action = new URL(req.url).searchParams.get('action');
    const body = await req.json().catch(() => ({}));

    // ---- a refund of a payment that is already marked refund_pending in the database
    const sendRefund = async (paymentId: string, rzpPayment: string, amount: number) => {
      try {
        const rf = await rz(`/payments/${rzpPayment}/refund`, { method: 'POST', body: JSON.stringify({ amount: paise(amount), speed: 'normal', notes: { payment_id: paymentId } }) });
        await db.rpc('mark_refund', { p_payment: paymentId, p_refund: rf.id, p_amount: amount });
        return true;
      } catch (e) { console.error('refund failed', paymentId, String(e)); return false; }
    };
    // ---- Razorpay says this payment is real, belongs to this order and is for the right amount (capturing it if it was only authorised)
    const paymentIsGood = async (order: string, rzpPayment: string) => {
      const { data: row } = await db.from('event_payments').select('amount_inr').eq('razorpay_order_id', order).maybeSingle();
      if (!row) return false;
      let p = await rz(`/payments/${rzpPayment}`);
      if (p.order_id !== order || p.amount !== paise(row.amount_inr) || p.currency !== 'INR') return false;
      if (p.status === 'authorized') p = await rz(`/payments/${rzpPayment}/capture`, { method: 'POST', body: JSON.stringify({ amount: p.amount, currency: 'INR' }) });
      return p.status === 'captured';
    };

    if (action === 'create') {
      const { data: r, error } = await me.rpc('begin_event_purchase', { p_event: body.event_id, p_ticket: body.ticket_id, p_code: body.code ?? null });
      if (error) return json({ error: error.message }, 400);
      if (r.free) return json({ free: true, result: r.result, payment_id: r.payment_id });
      try {
        const order = await rz('/orders', { method: 'POST', body: JSON.stringify({ amount: paise(r.amount_inr), currency: 'INR', receipt: String(r.payment_id).slice(0, 40), notes: { payment_id: r.payment_id, event: r.title, ticket: r.ticket } }) });
        await db.rpc('attach_razorpay_order', { p_payment: r.payment_id, p_order: order.id });
        const { data: a } = await db.from('members').select('applicant_id').eq('id', uid).maybeSingle();
        const { data: ap } = a ? await db.from('applicants').select('full_name, phone, personal_email').eq('id', a.applicant_id).maybeSingle() : { data: null };
        return json({ order_id: order.id, key_id: KEY_ID, amount_paise: order.amount, payment_id: r.payment_id, title: r.title, ticket: r.ticket, list_price_inr: r.list_price_inr, discount_inr: r.discount_inr,
          prefill: { name: ap?.full_name ?? '', email: ap?.personal_email ?? u.user?.email ?? '', contact: ap?.phone ?? '' } });
      } catch (e) {
        await db.from('event_payments').update({ status: 'failed' }).eq('id', r.payment_id);
        return json({ error: 'razorpay_failed', detail: String(e) }, 502);
      }
    }

    if (action === 'verify') {
      const { order_id, payment_id, signature } = body;
      if (!order_id || !payment_id || !signature) return json({ error: 'bad_request' }, 400);
      const expected = await hmacHex(KEY_SECRET, `${order_id}|${payment_id}`);
      if (!same(expected, String(signature))) return json({ error: 'signature_invalid' }, 400);
      const { data: row } = await db.from('event_payments').select('id, member_id').eq('razorpay_order_id', order_id).maybeSingle();
      if (!row || row.member_id !== uid) return json({ error: 'payment_not_found' }, 404);
      if (!(await paymentIsGood(order_id, payment_id))) return json({ error: 'payment_not_captured' }, 402);
      const { data: c, error } = await db.rpc('confirm_event_payment', { p_order: order_id, p_rzp_payment: payment_id, p_method: null });
      if (error) return json({ error: error.message }, 500);
      if (c.result === 'oversold') { await sendRefund(c.payment_id, payment_id, c.amount_inr); return json({ result: 'oversold' }); }
      return json({ result: c.result });
    }

    if (action === 'cancel') {
      const { data: c, error } = await me.rpc('cancel_paid_rsvp', { p_event: body.event_id });
      if (error) return json({ error: error.message }, 400);
      if (!c.payment_id || !(Number(c.refund_inr) > 0) || !c.razorpay_payment_id) return json({ refund_inr: 0 });
      const ok = await sendRefund(c.payment_id, c.razorpay_payment_id, Number(c.refund_inr));
      return json({ refund_inr: Number(c.refund_inr), refunded: ok });
    }

    if (action === 'refund') {
      const { data: isAdmin } = await me.rpc('is_admin');
      if (isAdmin !== true) return json({ error: 'not_allowed' }, 403);
      let ids: string[] = body.payment_id ? [body.payment_id] : [];
      if (body.event_id) { const { data } = await me.rpc('admin_event_refund_targets', { p_event: body.event_id }); ids = data ?? []; }
      let done = 0; let failed = 0;
      for (const id of ids) {
        const { data: t, error } = await me.rpc('admin_prepare_refund', { p_payment: id, p_amount: body.amount ?? null });
        if (error) { failed++; continue; }
        (await sendRefund(t.payment_id, t.razorpay_payment_id, Number(t.amount_inr))) ? done++ : failed++;
      }
      return json({ refunded: done, failed });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error(String(e));
    return json({ error: 'server_error' }, 500);
  }
});
