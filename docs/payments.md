# Event payments (Razorpay)

Payments exist only for events. Bookings, channels and everything else are free.

## How a purchase works
1. An event has ticket types (`event_tickets`: name, price in rupees, optional quantity) and refund rules (`events.refund_rules`: `[{hours_before, percent}]`). The portal's event form edits both. `events.price_inr` is kept as the lowest ticket price ("from").
2. The member picks a ticket (and optionally a promo code) in the app. The app calls the `payments` function, `action=create`. The database function `begin_event_purchase` checks the member, the rules (city, age, gender, reliability), capacity, ticket quantity, promo validity, and prices it. It holds the spot for 15 minutes (`event.payment_hold_minutes`). Amounts always come from the database.
3. The function creates a Razorpay order and returns it. The app opens `https://thesemicircle.in/pay/?...` (the page in `/pay`) in the browser. It runs Razorpay Checkout and sends the result back to the app by deep link.
4. The app calls `action=verify` with Razorpay's signature. The function checks the signature, fetches the payment from Razorpay (right order, right amount, captured; it captures an authorised payment), then `confirm_event_payment` gives the member a spot (`finish_event_payment`). If the spot sold out meanwhile, the payment is refunded in full automatically.
5. Safety net: the `razorpay-webhook` function receives `payment.captured` and `payment.failed` from Razorpay and does the same confirmation, so a member who never returns to the app still gets their spot.

## Cancelling and refunds
- Member cancels: `cancel_paid_rsvp` frees the spot, records the reliability event as for any cancel, and works out the refund from the event's rules (the most generous rule whose `hours_before` still fits). The function then asks Razorpay to refund it and marks it. If Razorpay fails, the payment stays `refund_pending` and an admin can retry from Payments.
- Admin: Payments page (refund any amount) and "Refund all paid tickets" on a cancelled event.
- Promo codes: percent or fixed amount, per event or for all, with a use limit and expiry. A 100% code gives the spot without any payment.

## Setup (once)
1. Razorpay dashboard > Settings > API keys: generate a key pair. Use test mode first.
2. Supabase > Edge Functions > Secrets: add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. Razorpay > Settings > Webhooks > Add: URL `https://qjtuahvhszxektzdmmdf.supabase.co/functions/v1/razorpay-webhook`, a secret of your choice, events `payment.captured` and `payment.failed`. Put the same secret in Supabase as `RAZORPAY_WEBHOOK_SECRET`.
4. The `/pay` page ships with the website (merge to `main`).
5. Switch to live keys by replacing the two key secrets.

Tables: `event_tickets`, `promo_codes`, `event_payments` (status created, paid, failed, expired, refund_pending, refunded, partially_refunded), plus `event_rsvps.ticket_id` and `payment_id`. All have RLS on with no member policies; members reach them only through the functions above.
