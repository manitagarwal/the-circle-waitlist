# The Semi Circle: Database Schema (draft 1, not yet applied)

Derived from `docs/app-logic-spec.md`. Nothing here exists in Supabase yet except `applicants` and `referrals`. Review this, then I apply it in steps (one migration per step in the build order at the bottom).

Conventions: `uuid` primary keys, `timestamptz` everywhere, `citext` for usernames, RLS on every table, limits enforced by SQL functions (the app calls functions, not raw inserts, for anything with a rule).

## 1. Configuration (changeable without an app release)

| Table | Columns | Notes |
|---|---|---|
| `interest_groups` | id, name, sort | The 7 groups from the blueprint |
| `interests` | id, group_id, name, slug, is_active | The ~60 launch interests. Adding one auto-creates its Lobby channel |
| `interest_suggestions` | id, member_id, text, status (pending/approved/rejected), reviewed_by, created_at | Admin review queue |
| `avatars` | id, key, label | The 10-12 built-in animated avatars |
| `rules` | id, interest_id (null = global), key, value jsonb | **Per-activity overrides.** Lookup = interest row, else global row. Keys: `booking.window_min_hours` (6), `booking.window_max_hours` (24), `booking.lockin_hours` (3), `booking.max_open_hosted` (2), `booking.max_per_24h` (3), `channel.max_open` (2), `channel.milestone_members` (50), `score.new_member_default` (8), `score.min_actions` (5), `score.weight.*`, `score.recency.*`, `score.threshold.*` |
| `blocked_words` | id, word | Checked before a message insert |
| `reserved_usernames` | username | admin, support, etc. |

## 2. Identity and membership

| Table | Columns | Notes |
|---|---|---|
| `applicants` (exists) | id, full_name, phone, personal_email, work_email, work_email_verified, linkedin_url, city, status, created_at, referred_by_id | Add: `reviewed_at`, `reviewed_by`. Source of truth for contact details |
| `referrals` (exists) | id, applicant_id, name, email, phone, created_at | Waitlist vouching |
| `invitations` (retired 4 Oct 2026, kept for history) | id, applicant_id (unique), code_hash, status (active/redeemed/revoked), created_at, redeemed_at, redeemed_by (auth uid) | One per accepted applicant. Never expires. Regenerate = revoke old, create new |
| `members` | id (= auth.users.id), applicant_id (unique), username (citext, unique), avatar_id, photo_path, bio, dob, gender, address_text, lat, lng, area, field_of_work, role (member/admin), state (active/suspended/banned), suspended_until, username_changed_at, created_at | **A row here = a member.** Name, work email, phone and LinkedIn are read from `applicants`, not copied |
| `member_interests` | member_id, interest_id | Trigger: 3 to 5 rows per member |
| `username_holds` | username, released_at | Old names blocked for 30 days |
| `push_tokens` | member_id, token, platform | |
| `notification_prefs` | member_id, category, enabled | |

Username CHECK: `^[a-z0-9]([a-z0-9._]{1,18}[a-z0-9])?$` plus no `..`, `__`, `._`, `_.`. Public profile data is exposed through a view `member_profiles` (username, name, photo, bio, computed age, area, interests, bookings hosted, member since). **DOB, address, phone, emails and Score are never in that view.**

## 3. Channels and messaging

| Table | Columns | Notes |
|---|---|---|
| `channels` | id, kind (lobby/public/private/booking/dm), interest_id, name, photo_path, created_by, booking_id, expires_at, deleted_at, created_at | Lobby: one per interest. DMs reuse this table with exactly 2 members, so realtime works the same everywhere |
| `channel_tags` | channel_id, tag_type (area/activity/age_group/gender), value | Powers the Public-tab filters |
| `channel_members` | channel_id, member_id, role (admin/member), joined_at | |
| `channel_invites` | id, channel_id, inviter_id, invitee_id, status (pending/accepted/declined), created_at | Private channels. Shows in Activity |
| `messages` | id, channel_id, sender_id, body, created_at, edited_at, deleted_at | Text only at launch. Lobby: insert allowed for admins only |
| `polls`, `poll_options`, `poll_votes` | | Lobby polls. **Built later**, not in step 1 |

## 4. Bookings

| Table | Columns | Notes |
|---|---|---|
| `bookings` | id, host_id, kind (admin/member), interest_id, title, description, venue_name, area, address_outer, lat, lng, starts_at, ends_at, headcount_min, headcount_max, male_slots, female_slots (both null = gender-agnostic), min_score, age_min, age_max, status (open/full/completed/cancelled), cancelled_at, channel_id, created_at | CHECK: member bookings start on :00/:30 and fall inside the window from `rules` |
| `booking_participants` | booking_id, member_id, status (joined/left_early/left_late/attended/no_show), joined_at, left_at, marked_at | Host row included. Attendance defaults to attended after 48 h |

## 5. Social

| Table | Columns | Notes |
|---|---|---|
| `friendships` | member_a, member_b (ordered pair), requested_by, status (pending/accepted/declined), message, created_at, responded_at | One row per pair. Declined = 30-day cooldown |
| `blocks` | blocker_id, blocked_id, created_at | |

DM tabs are derived: Friends = accepted friendship, Strangers = otherwise. The one-message limit is enforced in `send_dm`.

## 6. Activity feed

| Table | Columns | Notes |
|---|---|---|
| `notifications` | id, member_id, type, payload jsonb, read_at, created_at | Types: channel_invite, friend_request, booking_join, booking_cancelled, broadcast, moderation_notice, booking_reminder |

## 7. Score and moderation (append-only)

| Table | Columns | Notes |
|---|---|---|
| `score_events` | id, member_id, type (attended/hosted/early_cancel/late_cancel/no_show/report_minor/report_severe), weight_snapshot, booking_id, report_id, created_at | Never updated or deleted. Weights are snapshotted so later config changes do not rewrite history |
| `reports` | id, reporter_id, reported_id, category, reason, context (booking/channel/message ids), is_safety, status (open/upheld_minor/upheld_severe/dismissed), reviewed_by, created_at, resolved_at | Safety reports go to a separate queue (`is_safety`) |
| `moderation_actions` | id, member_id, action (warning/suspension/ban), reason, starts_at, ends_at, report_id, by_admin | Drives `members.state` |

Score is a function `member_score(member_id)`, not a stored number. It applies the weights, the 30/90-day recency multipliers and the new-member default (8.0 when the member has fewer than 5 actions, or when P+N = 0).

## 8. Functions (where the rules live)

`has_password()`, `applicants.auth_user_id` (owner, set by trigger; `my_application` and `activate_membership` use it), (true once the person has really set a password; tracked by trigger `trg_note_password_change` into `account_security`, because Supabase gives passwordless accounts a random hash), `activate_membership(username)` (replaces `redeem_invitation`, retired), `my_application()`, `accept_applicant(id)` (replaces `issue_invitation`, retired), `set_username(name)`, `create_channel(...)` (2-open cap, milestone), `create_booking(...)` (window, half-hour, 2-open, 3-per-24h, score-reduced cap), `join_booking(id)` (locks the row; checks seats, gender slot, age, min score), `leave_booking(id)` (early vs late from `booking.lockin_hours`), `mark_attendance(...)`, `continue_booking_channel(id)` (host only), `send_dm(...)`, `request_friend(...)`, `block_member(...)`, `member_score(...)`, `hosting_limit(...)`, `is_active_member()` (used by every RLS policy).

Scheduled jobs (pg_cron): every 10 min complete finished bookings and delete expired booking channels; hourly default-to-attended after 48 h; hourly end finished suspensions; nightly purge of soft-deleted accounts older than 30 days.

## 9. Security rules

1. Every table has RLS. Every policy requires `is_active_member()`, so having an auth account alone gets you nothing.
2. Members read only: channels they belong to (plus Public channels and Lobby), bookings, `member_profiles`, their own notifications, Score, friendships and DMs.
3. Trust tables (`score_events`, `reports`, `moderation_actions`) are insert-only through functions; no updates or deletes for anyone but service role.
4. Storage buckets: `profile-photos` and `channel-photos`, public read, write only to own path.

## 10. Build order (one migration each, tested before the next)

1. Config tables and seed data (interests, avatars, rules, reserved usernames)
2. Invitations, `members`, username rules, `redeem_invitation`
3. Profile view and member interests
4. Channels, members, messages, and Lobby auto-creation
5. Public/private channel rules and invites
6. Bookings, participants, join/leave, booking channels
7. Friends, blocks, DMs
8. Notifications and push tokens
9. Score events, `member_score`, moderation
10. Scheduled jobs

## Events and admin portal
- Tables: `events` (status draft/published/completed/cancelled, capacity, price_inr, age_min/max, genders, cities, min_score, cover_path), `event_rsvps` (status going/waitlist/attended/no_show/cancelled, ticket_code, checked_in_at). View `events_overview`. Private bucket `event-covers` (admins write, active members read).
- Member functions: `rsvp_event`, cancel RSVP, ticket lookup.
- Admin functions: `admin_events`, `admin_event_get`, `admin_save_event`, `admin_set_event_status`, `admin_event_attendees`, `admin_mark_rsvp`, `admin_check_in`, `admin_overview`, `send_broadcast`, `admin_lobbies`, `admin_post_to_lobbies`, `review_applicant`, `accept_applicant`, `apply_moderation`, `lift_moderation`, `resolve_report`, `approve_interest_suggestion`, `reject_interest_suggestion`.
- Column `applicants.acceptance_emailed_at`. Edge function `send-acceptance` (admin-only, sends via Resend). Email templates live in `supabase/email-templates/`.
- Admin views: `admin_applicants_queue`, `admin_members`, `admin_reports_queue`, `admin_interest_suggestions`, `admin_low_score_members`. Policy `admins read bookings` lets the portal list bookings.

## Push and announcements
- `notifications.send_push`, `notifications.pushed_at` (set once the alert has been sent or skipped). `messages.image_path` (lobby posts by admins). Table `announcements` (history of admin sends; admin read only). Private bucket `announcement-images` (admins write, active members read).
- Admin functions: `admin_send_notification(title, body, image_path, interest_id, cities, send_push)`, `admin_post_lobby_message(body, channels, image_path)`, `admin_lobbies()`. `push_secret_ok(text)` (service role only) checks the vault secret `push_secret`.
- Cron job `semicircle-push` (every minute) posts to the `push-dispatch` edge function with that secret, through `pg_net`.

## invite_to_public_channel(p_channel, p_invitee)
Security definer. Caller must be in the public channel; invitee must be an active, onboarded member, not already in it, not blocked either way. Inserts a `channel_invite` notification (payload: channel_id, channel_name, inviter_id, inviter_username). Idempotent per inviter/invitee/channel per day; rate rule `channel.max_invites_per_day` = 30.
