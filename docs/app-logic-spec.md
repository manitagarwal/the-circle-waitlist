# The Semi Circle: App Logic Spec (draft 1)

Source: blueprint v2. Each rule is either **[BP]** (stated in the blueprint) or **[PROPOSED]** (my default, needs your yes/no). Section 14 collects everything that needs a decision. The database schema will be derived from this document only after sign-off.

---

## 1. Membership lifecycle

A person moves through these states. Each state is derived from data, not stored twice.

| State | How you get there | What you can do |
|---|---|---|
| Applicant | Submit waitlist form (`applicants.status = pending`) | Check status only |
| Shortlisted | Team marks `shortlisted` | Same |
| Accepted | Team marks `accepted`; an invitation code is issued | Redeem code in the app |
| Member | Redeems code, logs in, completes profile | Full app |
| Suspended | Moderation ladder (section 11) | Read only; no booking, messaging or channel creation |
| Banned | Moderation ladder | No access |
| Rejected | Team marks `rejected` | Check status only |

- **[BP]** The app is not open to everyone. Only accepted applicants can become members.
- **[PROPOSED]** Auth accounts already exist for every applicant who verified a work email (the waitlist uses `signInWithOtp` with `shouldCreateUser`). Having an auth account therefore means nothing. Membership = a row in `members` linked to an accepted applicant. Every app screen and every RLS policy checks for that row.
- **[PROPOSED]** Rejected applicants may not reapply with the same phone or email (the unique indexes already enforce this).

## 2. Invitation codes and sign-up

1. **[BP]** On acceptance, the applicant receives an invitation code by email or WhatsApp.
2. **[DECIDED]** One code per accepted applicant. Single use, **never expires**, regenerable by an admin (regenerating invalidates the old code). Random and unguessable (10+ characters).
3. **[BP]** Sign-up carries over name, verified work email, LinkedIn URL and phone from `applicants`. They are never asked again.
4. **[DECIDED, changes the blueprint]** Login is by **email only** at launch (no phone login). First sign-in is an emailed OTP to the verified work email. After that the member **creates a password and a username**; later logins use email + password (OTP stays available as a fallback / password reset).
5. **[DECIDED]** **Username**: unique across all members; only lowercase letters, numbers, `.` and `_`. **[PROPOSED]** 3-20 characters, cannot start or end with `.` or `_`, no two `.`/`_` in a row, a reserved list is blocked (admin, support, semicircle, etc.), stored lowercase and compared case-insensitively. Changeable at most once every 30 days; old name is not reusable by others for 30 days.
6. Redeeming a code links `auth.users.id` to the `applicants` row and creates the `members` row. A code cannot be redeemed twice or by a different account.

## 3. Profile

- **[DECIDED]** Username (see section 2) is part of the profile and shown on it.
- **[BP]** Required: interests (min 3, max 5), date of birth, gender, address, field of work. Photo is optional because there are 10-12 built-in animated avatars.
- **[BP]** DOB is stored privately. Other members see computed age only.
- **[BP]** No profile can be private. Every member's profile is visible to every other member.
- **[BP]** Address supports device geolocation or manual search.
- **[PROPOSED]** Store address as text plus lat/lng, and derive an "area" label (for example Sector 43, Gurgaon) used for filtering. Exact address is never shown to other members; only the area is.
- **[PROPOSED]** Gender options: Male, Female, Non-binary, Prefer not to say. Required to answer, but "prefer not to say" is allowed. Gender-filtered bookings exclude "prefer not to say" members from gendered slots; decide whether that is acceptable (section 14, item 8).
- **[BP]** Public profile shows photo, bio, friends, bookings listed, channels of interest, posted photos, bookings hosted count, member since.
- **[PROPOSED]** "Posted photos" is unclear since the Feed was removed. I assume this means photos a member adds to their own profile. Confirm (section 14, item 9).

## 4. Interests and channels

- **[BP]** The launch interest list is in blueprint section 4, in 7 groups. It is reference data, editable by admins.
- **[BP]** Members can suggest new interests. Suggestions go to a review queue. Admins approve and add them.
- **[BP]** Discovery is by search bar only (name or activity), plus tag filters on Public.

### 4.1 Lobby channels
- One per interest, created automatically when an interest is added.
- **[BP]** Read-only for members. Only admins post (announcements, polls, updates).
- **[PROPOSED]** Members are auto-joined to the Lobby of each interest they selected. Poll votes are the only member write allowed there.

### 4.2 Public channels
- **[BP]** Any member can create one, tagged to an interest. The creator is the admin.
- **[BP]** Anyone can join with no approval.
- **[BP]** Max **2 channels open** per member at once.
- **[BP]** Creating more requires a milestone. **[PROPOSED]** threshold: one of your channels reaches **50 members** (blueprint example was 100; threshold is open).
- **[BP]** Tags: area, activity, age group, gender.

### 4.3 Private channels
- **[BP]** Invite-only.
- **[PROPOSED]** Created by a member, invite-only, counts toward the same 2-channel limit as Public. Also includes booking channels that the host converted with "continue".
- **[PROPOSED]** Invites can go to any member (not just friends). A recipient must accept in the Activity tab before they are added.

### 4.4 Channel admin rules (all types)
- **[BP]** Admins can change photo and name, add or remove members, promote admins, delete the channel.
- **[BP]** If the sole admin leaves, admin transfers to a random remaining member.
- **[PROPOSED]** If the last member leaves a channel, the channel is deleted.
- **[BP]** Anyone in a channel can see the full member list.
- **[PROPOSED]** Messages: text only at launch (images later). Edits and deletes of own messages allowed; admins can delete anyone's. Blocked-word list checked server-side before insert (section 11).

## 5. Bookings

### 5.1 Creating
- **[BP]** Two kinds: **Hosted by Admin** (team events) and **Private Event** (member-created).
- **[BP]** Member events must start **between 6 and 24 hours from now** at creation time. Admin events are exempt.
- **[BP]** Start times are on the half hour only.
- **[BP]** Max **2 hosted bookings open** per member at once, and max **3 created in any rolling 24 hours**.
- **[BP]** Score can reduce the 2-booking cap (section 9) but never raise it.
- **[BP]** Host sets: headcount (exact, min, or max), gender composition or gender-agnostic, minimum Score to join, age range, end time, short description.
- **[PROPOSED]** All of these limits are enforced by a database function, not by the app, so they cannot be bypassed.

### 5.2 Joining and leaving
- **[PROPOSED]** Joining is instant if the member meets every filter (gender slot, age range, min Score) and a seat is free. No host approval in v1.
- **[PROPOSED]** Seats are claimed atomically so two simultaneous joins cannot overfill.
- **[BP]** Joining auto-adds the member to the booking's channel.
- **[BP/PROPOSED]** Cancelling is "early" or "late" relative to a lock-in window (affects Score). **Window length is open: [PROPOSED] 3 hours before start.**

### 5.3 States
`open` -> `full` (optional, reopens if someone leaves) -> `completed`, or `cancelled` from open/full.
- **[PROPOSED]** A booking becomes `completed` automatically at its end time.
- **[PROPOSED]** Host can cancel; all joiners get a notification and the cancellation counts against the host's Score only if inside the lock-in window.

### 5.4 Attendance
- **[PROPOSED]** After the event ends, the host marks each joiner as attended or no-show (the blueprint removed QR check-in with payments). Attended and no-show feed Score. Joiners can dispute within 48 hours (raises a report).
- **[PROPOSED]** If the host marks nobody within 48 hours, everyone defaults to attended (avoids punishing people for a host who forgot).

### 5.5 Booking channel
- **[BP]** Auto-created, private, host is admin, joiners auto-added.
- **[BP]** Expires 24 hours after the event ends or is cancelled, unless the **host** presses "continue", which converts it to a permanent private channel.
- **[PROPOSED]** Expiry is a scheduled job (every 10 minutes); expired channels and their messages are deleted.

## 6. Friends and DMs

- **[BP]** Friend requests are sent from a profile, with an optional message.
- **[BP]** DMs have a Friends tab and a Strangers tab. Anyone can message anyone.
- **[BP]** A first message to a non-friend auto-sends a friend request. Only **one message** is allowed until accepted.
- **[BP]** Once accepted, the thread moves to Friends.
- **[BP]** No group DMs.
- **[BP]** Unfriend, block, report are actions on the profile.
- **[PROPOSED]** Block: hides both profiles from each other, prevents messaging, removes any existing friendship, leaves shared channels untouched but mutes each other's messages for both sides.
- **[PROPOSED]** If a friend request is declined, the one-message limit stays in force. The sender cannot message again. A declined sender cannot re-request for 30 days.

## 7. Notifications (Activity tab)

**[BP]** The four kinds: channel invites, friend requests received, someone joined a booking you listed, admin broadcast messages.

- **[PROPOSED]** Add: booking cancelled (for joiners), moderation notices (warning, suspension), booking reminders (1 hour before). The first two follow from other blueprint rules.
- **[BP]** Push notification permission is requested at sign-up.
- **[BP]** Toggle per category in Settings.

## 8. Referrals

- **[BP]** Every member has a private referral code. A new applicant who enters it gets **fast-tracked** entry.
- **[BP]** Waitlist-side vouching (what exists now): `referrals` rows and `referred_by_id`.
- **[PROPOSED]** Fast-track means: sorted to the top of the review queue. It does not mean automatic acceptance.
- **[PROPOSED]** Member referral code = the existing application short code (first 8 characters of their applicant `id`), so no new code system is needed.

## 9. Score

All of this follows blueprint section 9. Restated so the schema can be derived:

- Out of 10, **private** to the member.
- Until a member has **5 accountable actions**, Score is a flat **8.0**.
- Weights: attended +1.0; hosted successfully +1.5; early cancel -0.3; late cancel -1.5; no-show -3.0; upheld report minor -2.0; severe -5.0.
- Recency multiplier per action: last 30 days x1.0; 30-90 days x0.5; older x0.25.
- **Score = 10 x P / (P + N)**, where P = sum of weighted positives and N = sum of absolute weighted negatives. **Edge case: P + N = 0 means Score = 8.0 (new-member default).** Not covered in the blueprint.
- Thresholds: **7.0+** full privileges; **5.0-6.9** host max 1 at a time; **below 5.0** no hosting; **below 3.0** flagged for manual review.
- **[PROPOSED]** Every scoring event is a row in an append-only `score_events` table. Score is computed from it by a database function, not stored as a mutable number. This gives a full audit trail and lets you change weights later.
- **[PROPOSED]** Weights and thresholds live in a config table, not in code.
- **[PROPOSED]** Public metrics (separate from Score): bookings hosted count, member since.

## 10. Moderation and safety

- **[BP]** Report categories: Harassment/inappropriate behaviour, Fake profile, Inappropriate content, Repeated no-shows, Other (free text required).
- **[BP]** Ladder: 1st substantiated report -> warning; 2nd -> temporary suspension (7 days: no booking, messaging, channel creation); 3rd, or any single severe/safety report -> permanent ban, human-reviewed before final.
- **[BP]** Safety reports from meetups go to a separate urgent queue.
- **[BP]** Blocked-word list, maintained by the team, auto-blocks messages from sending.
- **[PROPOSED]** "Substantiated" means an admin reviewed the report and marked it upheld. Upheld reports also create a `score_events` row (minor or severe, chosen by the admin).
- **[PROPOSED]** Reports are never visible to the reported member beyond the outcome notice.

## 11. Admin

**[PROPOSED]** Admins are a role on `members`, not a separate system. Admin capabilities:
- Review applicants (shortlist, accept, reject) and issue or regenerate invite codes.
- Approve or reject interest suggestions.
- Post in Lobby channels, create Hosted-by-Admin bookings.
- Review reports, uphold or dismiss, apply the ladder.
- Maintain the blocked-word list and score config.
- **Launch tooling:** Supabase dashboard / SQL for the first batches. A custom admin page comes later.

## 12. Settings and account

- **[BP]** Edit name, photo, bio, interests, city, phone/email; block list; notification toggles; referral code view; legal links; logout; delete account / data export.
- **[PROPOSED]** Delete account = soft-delete immediately (anonymise profile, remove from channels, cancel open hosted bookings), hard-delete personal data after 30 days. Score events and report history are kept without personal data. Needs a legal check before launch.
- **[BP]** Legal text and a data retention policy are not yet defined. The schema should not block them.

## 13. Cross-cutting rules for the database

1. Every limit in sections 4, 5, 6 and 9 is enforced **in the database** (functions and RLS), never only in the app.
2. All app tables use RLS. No table is readable without a `members` row (section 1).
3. Anything affecting trust (score events, reports, moderation actions) is append-only.
4. Timestamps are `timestamptz`, shown in IST.
5. Reference data (interests, tags, avatars, weights, thresholds) is configuration in tables, so changing it needs no app release.

---

## 14. Decisions needed from you

Numbers 1-6 block the schema; 7-12 can be answered later but I will build the default.

1. **Login:** DECIDED. Email only; OTP first time, then password + unique username (section 2).
2. **Invitation code expiry:** DECIDED. Never expires.
3. **Booking lock-in window:** OPEN (explained in chat; default 3 hours before start).
4. **Private channels:** DECIDED. Invite-only, same 2-channel cap as Public, any member can be invited.
5. **Channel milestone:** DECIDED. 50 members to unlock a third channel.
6. **Attendance:** DECIDED. Host marks attended/no-show; defaults to attended after 48 hours.
7. **Joining a booking:** instant, no host approval?
8. **Gender "prefer not to say":** allowed, and excluded from gender-specific booking slots?
9. **"Posted photos" on profile:** photos the member adds to their own profile? (Feed was removed.)
10. **Fast-track:** top of review queue, not automatic acceptance?
11. **Account deletion:** soft-delete now, hard-delete after 30 days?
12. **Lobby name:** keep "Lobby"?
