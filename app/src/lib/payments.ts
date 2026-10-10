import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { SUPABASE_ANON_KEY, SUPABASE_URL, SITE_URL } from './config';
import { supabase } from './supabase';

type Json = Record<string, unknown>;

/** Calls the `payments` function as the signed-in member. Throws the function's error code as the message. */
async function call(action: 'create' | 'verify' | 'cancel', body: Json): Promise<Json> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/payments?action=${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify(body),
  });
  const j = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok) throw new Error(String(j.error ?? 'server_error'));
  return j;
}

export type BuyResult = 'paid' | 'cancelled' | 'failed' | 'oversold';

/**
 * Buys a ticket. The server prices it (the app only says which ticket and which promo code), Razorpay's checkout opens in the
 * browser on our own page, and when it hands back we ask the server to check the payment before the spot is given.
 */
export async function buyTicket(eventId: string, ticketId: string, promo: string): Promise<BuyResult> {
  const o = await call('create', { event_id: eventId, ticket_id: ticketId, code: promo.trim() || null });
  if (o.free) return o.result === 'paid' ? 'paid' : 'failed';
  const back = Linking.createURL('paid');
  const pre = o.prefill as { name?: string; email?: string; contact?: string } | undefined;
  const q = new URLSearchParams({
    order: String(o.order_id), key: String(o.key_id), amount: String(o.amount_paise), name: String(o.title ?? ''), desc: String(o.ticket ?? ''),
    pn: pre?.name ?? '', pe: pre?.email ?? '', pc: pre?.contact ?? '', return: back,
  });
  const r = await WebBrowser.openAuthSessionAsync(`${SITE_URL}/pay/?${q.toString()}`, back);
  if (r.type !== 'success') return 'cancelled';
  const got = new URL(r.url);
  const status = got.searchParams.get('status');
  if (status !== 'paid') return status === 'failed' ? 'failed' : 'cancelled';
  const v = await call('verify', { order_id: got.searchParams.get('order_id'), payment_id: got.searchParams.get('payment_id'), signature: got.searchParams.get('signature') });
  return v.result === 'oversold' ? 'oversold' : 'paid';
}

/** Cancels a paid ticket; the refund follows the event's own rules. Returns the rupees being refunded. */
export async function cancelPaidTicket(eventId: string): Promise<number> {
  const r = await call('cancel', { event_id: eventId });
  return Number(r.refund_inr ?? 0);
}
