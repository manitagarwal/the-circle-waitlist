# Reliability score

A number from 0 to 10, computed on read from the append-only `score_events` table (plus `member_sign_ins`). Nothing is stored.
The formula is `calc_score(events, signins)` in the database and `app/src/lib/score.ts` in the app; `score.test.ts` pins the app to the database results.

For each event of age `a` days: `d(a) = 0.5 ^ (a / score.half_life_days)` (90).

- Good points `P = sum(weight * d)` over attended (+1) and hosted (+1.5), plus sign-ins: `min(score.signin_cap, score.signin_weight * sum(d of each day they opened the app))` (0.02 per day, at most 1 in total).
- Penalty points `Q = sum(|weight| * d * m)`:
  - no-show (-3) and late cancel (-1.5): `m = g / (1 + G / score.cushion_divisor)`; `g = score.grace_factor` (0.5) if it is the first mistake (no-show, late cancel, host no-show or host late cancel) in the previous `score.grace_window_days` (180), else 1; `G` = attended + hosted events in that window before it.
  - early cancel (-0.3): `m = 1 / (1 + G / 4)`.
  - host late cancel (-6), host no-show (-10), upheld reports (-2, -5): `m = 1`. No discount, no cushion.
- `score = 10 * (P + k * default / 10) / (P + Q + k)` with `k = score.prior_weight` (5) and `default = score.new_member_default` (8), clamped to 0..10 and rounded to one decimal. A member with no events scores 8.0.

Where events come from: `finalize_bookings` (attended, hosted), `leave_booking` and `cancel_rsvp` (early or late cancel), `mark_attendance` and `admin_mark_rsvp` (no-show), `cancel_booking` (host cancel), `admin_record_host_no_show(booking)` (portal button), `resolve_report` (reports). `note_sign_in()` records one day per member (app calls it on open and on coming back to the app). All numbers are rows in `rules`, editable in the portal. `score_rules()` lets the app show the live numbers on the Reliability screen.

Worked examples (also shown in the app): new member 8.0; ten good events 9.0; ten good then one no-show 8.6; one good then one no-show 6.7; ten good then two no-shows in a fortnight 8.0; twenty good with one old no-show 9.2; a month of daily sign-ins 8.2; ten good then a host no-show 4.6.
