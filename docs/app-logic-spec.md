# The Semi Circle: App Logic Spec (draft 1)

Source: blueprint v2. Each rule is either **[BP]** (stated in the blueprint) or **[PROPOSED]** (my default, needs your yes/no). Section 14 collects everything that needs a decision. The database schema will be derived from this document only after sign-off.

---

## 1. Membership lifecycle

A person moves through these states. Each state is derived from data, not stored twice.

| State | How you get there | What you can do |
|---|---|---|
| Applicant | Register in the app (or the website form); `applicants.status = pending`. The account stays signed in | See application status only |
| Shortlisted | Team marks `shortlisted` | Same |
| Accepted | Team runs `accept_applicant(id)` | Pick a username (`activate_membership`) |
| Member | Picks a username, completes profile | Full app |
| Suspended | Moderation ladder (section 11) | Read only; no booking, messaging or channel creation |
| Banned | Moderation ladder | No access |
| Rejected | Team marks `rejected` | Check status only |

- **[BP]** The app is not open to everyone. Only accepted applicants can become members.
- **[PROPOSED]** Auth accounts already exist for every applicant who verified a work email (the waitlist uses `signInWithOtp` with `shouldCreateUser`). Having an auth account therefore means nothing. Membership = a row in `members` linked to an accepted applicant. Every app screen and every RLS policy checks for that row.
- **[PROPOSED]** Rejected applicants may not reapply with the same phone or email (the unique indexes already enforce this).

## 2. Account-first sign-up (replaces invitation codes, decided 4 Oct 2026)

1. **[DECIDED]** There is no invitation code. Registering **is** requesting an invitation: the work-email account and the application are the same thing. Work email (verified by an emailed code) is the access check.
2. **[DECIDED]** After submitting, the person stays signed in and can log in any time. What they see depends on their application: no application yet -> the application form; pending or shortlisted -> an "under review" screen with queue position and referral code; rejected -> a polite "not this time" screen (no reapply); accepted -> "You're in", pick a username, optional password, profile setup, then the app.
3. **[DECIDED]** The account is matched to its application by **work email** (verified by the emailed code), so website applicants are matched too. `my_application()` returns the caller's own status.
4. **[DECIDED]** Accepting = `accept_applicant(applicant_id)` (admin only, run in the dashboard for now). It sets status `accepted` and creates nothing else. The member row is created when the person picks a username with `activate_membership(username)`, which checks that the caller's work email belongs to an accepted application.
5. **[DECIDED, 5 Oct 2026]** The login (account) email is the **personal email**; the work email is only a check on the application. Login is by **personal email + password only** (no phone login, no login by emailed code). A password is **mandatory**: it is created right after the personal email is verified by an emailed code. **Both emails are verified** (decided 8 Oct 2026 after briefly trying an unverified personal email, which was judged unsafe): the personal email by a code that creates the account, the work email by a code through a separate throwaway client. The server alone decides `work_email_verified`. An application is owned by the **account** that filed it (`applicants.auth_user_id`, set by a server trigger, never by the client), and can only be filed for a work inbox that has been confirmed (insert policy). Emailed codes are also used to **reset a forgotten password**. Application flow: details, verify personal email and create password, verify work email, vouch, review. Anyone with an account but no password (for example someone who applied on the website) is stopped at a "create your password" screen. Old passwords are not stored: Supabase keeps only a salted hash of the current one.
6. **[DECIDED]** **Username**: unique across all members; lowercase letters, numbers, `.` and `_`; 3-20 characters, cannot start or end with `.` or `_`, no two in a row; reserved list blocked; changeable once every 30 days. Chosen after acceptance so names are not claimed by people who are not in.
7. The old invitation-code path (`issue_invitation`, `redeem_invitation`, `invitations` table) is retired: execute rights revoked, table kept for history.
8. **[OPEN]** Telling people they were accepted: email (needs the SMTP sender) and later a push. Until then they find out by opening the app.

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
- **[DECIDED, 8 Oct 2026]** Channel tags. Activity: every activity belongs to a bigger bucket such as Sports and fitness, and buckets are collapsible wherever activities are listed. Lobbies are named after the activity alone. **Public channels carry rules that are enforced when someone joins:** **city** (one or several cities, or none for Pan India; matched against the member's application city), **age** (optional youngest and oldest, 18 to 99, typed in) and **gender** (Anyone, or one or more of the four sign-up options). Someone who does not match can see the channel but cannot join, and is told why. **Area** is only a label. App admins bypass the rules. **Private channels have no matching rules**: they are invite-only, and anyone invited can join.
- **[DECIDED, 9 Oct 2026] Groups replace private channels.** Channels now has Lobby, Public and **Booking** (only the chats of bookings you host or joined). A **group** (stored as a private channel) lives in Messages, in a Groups sub-tab between Friends and Strangers. Groups are casual: no activity, no matching rules. **You can only add friends**, and an admin adds them directly with **no acceptance needed**; anyone can leave. **Maximum 50 members.** There is no cap on how many groups a person can create, only an anti-spam burst limit. Being added sends a notification. The invitation path is retired. "Keep this chat" turns a booking chat into a group.
- **[DECIDED, 9 Oct 2026] Anti-spam limits** (all are rules, editable without a release; app admins are exempt where sensible): messages 20 per minute and 300 per hour; friend requests 20 per day (on top of the existing pending and cooldown rules and the one-message-until-accepted rule); groups created 10 per day; friends added to groups 100 per day; self-joined public channels 30 per hour; booking joins 20 per hour. Existing limits stay: 5 reports per day, 3 pending interest suggestions, 12 photos, one username change every 30 days, booking limits, public channel limit of 2 open.

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
- **[DECIDED, 8 Oct 2026]** Hosting a booking: the host picks a **date** (calendar) and a **start time** (hour, minutes limited to :00 and :30, AM or PM). The start must fall **6 to 24 hours from now** (the window rule, read from the rules table, and expected to change). **Length** is chosen in 30-minute steps from 30 minutes up to a maximum that is a rule per activity: **2 hours for everything under Sports and fitness, 6 hours for all other activities** (`booking.max_duration_minutes`, editable). The end must also fall on the hour or half hour. The Bookings list groups activities into their collapsible buckets, with day headings inside.
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
5. Reference data (interests, tags, avatars, weights, thresholds) is configuration in tables, so changing it needs no app release. **Rules resolve as: per-activity override, else global default.**

---

## 14. Decisions needed from you

Numbers 1-6 block the schema; 7-12 can be answered later but I will build the default.

1. **Login:** DECIDED. Email only; OTP first time, then password + unique username (section 2).
2. **Invitation code expiry:** no longer applies (codes retired).
3. **Booking lock-in window:** DECIDED. 3 hours before start. **Rules can differ per activity later**, so every number in sections 4, 5 and 9 (windows, caps, lock-in, thresholds) lives in a config table with a global default and optional per-interest overrides, never hard-coded.
4. **Private channels:** DECIDED. Invite-only, same 2-channel cap as Public, any member can be invited.
5. **Channel milestone:** DECIDED. 50 members to unlock a third channel.
6. **Attendance:** DECIDED. Host marks attended/no-show; defaults to attended after 48 hours.
7. **Joining a booking:** instant, no host approval?
8. **Gender "prefer not to say":** allowed, and excluded from gender-specific booking slots?
9. **"Posted photos" on profile:** photos the member adds to their own profile? (Feed was removed.)
10. **Fast-track:** top of review queue, not automatic acceptance?
11. **Account deletion:** soft-delete now, hard-delete after 30 days?
12. **Lobby name:** keep "Lobby"?

## Events (hosted by us)
- Admins create events in the admin portal (draft → published → completed or cancelled). Members see published events in the Events tab.
- Reserving is free and instant. When capacity is full the member joins a waitlist and is promoted automatically when a spot opens.
- Each reservation gets a ticket code shown as a QR in the app. Admins check people in by typing the code in the portal.
- Eligibility rules per event: city list, age range, genders and minimum reliability score. Rules are enforced by the database, not the app.
- Attended and no-show feed the reliability score. Cancelling an event notifies everyone reserved.
- Priced events are shown with their price but cannot be reserved yet ("Tickets open soon"). Payments are not built.
- Rate limit: `event.max_rsvps_per_hour`.
- Not in v1: event chat, reminders.

## Admin portal (thesemicircle.in/admin)
- Email and password only. The authenticator-app step is built but switched off (`REQUIRE_MFA` in admin.js). Only accounts that pass `is_admin()` get in.
- Pages: Dashboard, Applicants (shortlist, accept, reject), Members (warn, suspend, ban, lift), Reports (dismiss, minor, severe), Events (create, edit, publish, cancel, complete, attendees, check-in, CSV, cover image), Applicants: accepting also emails them (send-acceptance function, needs the Resend key as a Supabase secret). Announcements (a notification to all or by activity, or a message posted in chosen lobbies), Bookings (read only), Settings (rules, activities, suggestions, blocked words), Activity log.
- Every action calls an admin-only database function or a table with an admin-only policy.

## Website apply flow (thesemicircle.in)
- The website form is the same five steps as the app, with the same wording, checks and database calls: Details, Login (personal email code, then password), Work email (verified through a throwaway client), Vouch (referral code and people), Review and submit.
- "Already applied? Log in" on the page signs in with email and password and shows the application status (queue position, declined, accepted, or already a member). "Forgot, or haven't set a password?" uses the emailed code. This replaces the old status page; `status.html` now just redirects.
- A referral link `/?ref=CODE` pre-fills the referral code on step 4.
- Nothing typed on the page is ever inserted as HTML.

## Phone numbers
- The number box takes digits only, capped at the right length for the chosen country, with a separate country-code picker that defaults to +91. Pasting "+91 98765 43210" moves the code into the picker.
- India: exactly 10 digits starting 6 to 9. Other listed countries: their own length rules (a leading 0 is dropped).
- Stored as `+<code><number>` (for example `+919876543210`). The database enforces the format (`applicants_phone_format`), so a bad number is refused even if the app is bypassed. Duplicates are matched on the last 10 digits.
- Same rules on the website form and in the app (`app/src/lib/phone.ts`).

## Looking at other members' profiles
- A profile opens from: a member's name above their message in a channel (not in Lobbies), the title or "View profile" in a direct message, a name in a booking's "Who's in" list or the host's name, a member in a channel's member list, a friend request in Activity, and the Friends list (tap the Friends number on your own profile).
- It shows: photo or avatar, name, username, age, area, field of work, bio, interests, bookings hosted, member since, upcoming bookings they host, and friends in common. It never shows phone, emails, date of birth, exact address, gender or LinkedIn.
- Actions: Add friend (request, optional note), Message (one message until they accept), and the ... menu with Unfriend, Report and Block. Blocked members cannot see each other's profiles at all.

## Legal pages and icon
- Privacy policy at /privacy/ and terms at /terms/ on the website, linked from Settings in the app. They are linked from the site footer. Operator: The Semi Circle, a sole proprietorship (B-3, Kundan Apartment, Jyotinagar, Sevoke Road, Siliguri - 734001, West Bengal); courts at Siliguri; declined applications kept 12 months; paid events are not available yet. Grievance officer is currently listed as "The Proprietor" and should be named. 
- App icon: the half-circle mark in gold on near-black (`app/assets/icon.png`, plus an Android adaptive icon, splash mark and favicon).

## Announcements, lobby messages and phone alerts (admin portal)
- Announcements page, three tabs. **Notification:** title, message, optional image, audience (everyone or one activity, optionally limited to cities), and a switch for "also send as a phone alert". It lands in every recipient's Activity list (with the image) and, if switched on, as a phone alert. **Lobby message:** a message with an optional image posted in all lobbies or chosen ones (members read, cannot reply). **Sent:** the history of everything sent, who it reached and whether it had an alert.
- Images go to a private storage bucket (`announcement-images`, max 5 MB, JPG/PNG/WebP) and are shown to members through short-lived links. On iPhone the image shows in the app and not in the alert; Android alerts can show it too.
- Phone alerts are sent for every notification the app creates (friend requests, bookings, events, announcements, account notices), not only announcements. A database job runs every minute and calls the `push-dispatch` function, which claims each new notification once, skips members who switched that kind off (account notices always go through), sends through Expo, and removes phone tokens that no longer work. Notifications older than two hours are never pushed.
- Tapping a phone alert opens Activity. Alerts that arrive while the app is open show as a banner.

## Design (the new look)
- White ground, near-black ink, soft grey surfaces for cards, fields and chips, and one yellow accent used sparingly (unread rings, the active-tab marker, the new-activity dot, highlights). Buttons are black pills.
- Type: Bricolage Grotesque for headlines (bold, tight), Figtree for body text.
- Signature shape: the half-circle. Photos sit in arch frames, channel avatars are arch-topped or carry a half-ring (yellow when something was posted in the last day), the active tab has a yellow half-circle marker.
- Motion: content fades up in sequence, the welcome rings draw themselves, the Lobby/Public/Booking switch slides, poll bars and the reliability bar fill, buttons shrink slightly when pressed. All of it is switched off when the phone has "reduce motion" on.
- Shared pieces live in `src/theme.ts`, `src/components/ui.tsx`, `motion.tsx`, `Arch.tsx`, `Pill.tsx`, `lists.tsx`. The design canvas ("New look" page) is the reference.

## Finding people and inviting them
- Find people (Messages search button, Friends screen): search all active members by name or username (2+ letters; with fewer, your friends show). Tap a result to open the profile (add friend, message, block) or press Message. Blocked members never appear.
- Inviting to a public channel: any member of the channel can invite any active member from channel settings, "Invite people". The invitee gets an Activity notification that opens the channel; they still join under the channel's own rules. Rules: one invite per person per channel per day, cap `channel.max_invites_per_day` (30) per member per day, no invites across a block.
- Groups (private) are unchanged: admins add friends directly.
- Every channel tied to an activity shows that activity's clipart (51 drawings, `activityIcons.ts`) instead of a letter; channels without an activity keep the letter.

## Design rules (current)
- Quiet luxury: warm ivory ground (deep charcoal in dark mode, following the phone's setting when the app opens), charcoal ink, stone surfaces, no accent colour and never red (errors are bold ink).
- Type: Fraunces for headings, Inter for text. Large headings with generous space.
- Navigation: a floating dark pill at the bottom; the current tab opens to show its name. Header row on main screens: name, find people, messages, activity.
- Tabs inside a screen are text with a sliding underline. Activity groups are a chip rail above one list.
- Activity clipart is monochrome (currentColor), bold, on a stone circle; chat shows it faintly as a watermark; events without a picture get a stone cover with drawn rings and the clipart.
- Avatars are twelve tonal figures. Photos are circles.
- Explanations live behind a small "i" (`Info`), not on the screen.
- Motion: springs on presses, tabs and the floating bar; items fade up; rings draw in; everything respects reduce-motion.

## Unread
- A dot on a channel, group or DM badge means it has messages you haven't opened; it goes away when you open the chat. Messages (DMs and groups) and Activity show a count on their header icons. Counts update live.
- Messages and Activity open as their own screens with a back button; the bottom bar is hidden there, like Find people.

## Event tickets and payments
- Events can have several ticket types with their own prices and quantities, optional promo codes and per-event refund rules, all set in the portal. Free events work as before.
- Buying: pick a ticket, optionally enter a promo code, pay in Razorpay's checkout (opens in the browser), come back with your ticket. A spot is held for 15 minutes while you pay. Paid events have no waitlist: sold out is sold out.
- Cancelling a paid ticket returns money by the event's refund rules and counts like any cancel for reliability.
- See `docs/payments.md`.

## Colour (livelier, still grown-up)
- Each of the seven activity groups has a soft colour (`app/src/lib/tones.ts`, pastel in light mode, deep in dark mode). It tints the circle behind an activity's clipart, event covers without a photo, booking cards, interest chips and the group dots in the filter rail. Everything else stays ivory and charcoal.
- The welcome screen shows three nested half-discs in those colours.
- Pictures: events use the cover photo an admin uploads (shown full width); members' photos stay circles.

## Activities, categories and booking limits (current)
Eight categories, 52 activities. Names must match `app/src/lib/tones.ts` and `activityIcons.ts` (a test checks every activity has a clipart and a colour).
- **Sports** (bookings): Badminton, Cricket, Football/Futsal, Pickleball & Padel, Tennis & Squash, Basketball, Table Tennis, Volleyball.
- **Outdoors & travel** (bookings): Treks & Hikes, Road Trips, Weekend Getaways.
- **Food, drinks & nightlife** (bookings): Cafe Hopping, Street Food Walks, Breakfast & Brunch, Lunch & Dinner, Cooking & Baking, Pub & Bar Nights, Clubbing.
- **Music & performance** (bookings): Open Mic, Karaoke, Dance, Stand-up Comedy, Theatre & Shows, Concert & Gig.
- **Games & watch parties** (bookings): Board Games, Card Games, Chess, Video Gaming, Quizzing & Trivia, Escape Rooms, Match Watch Parties.
- **Career & tech** (no bookings): Startups & Networking, Coding & Tech Meetups, Investing & Finance, Public Speaking & Debate, Design & Product.
- **Culture, learning & causes** (bookings): Photography, Art & Sketching, Film & Cinema Club, Podcasting & Content Creation, Museums & Galleries, Volunteering & Clean-up Drives, Pet Lovers, Language Learning, Writing & Poetry.
- **Clubs** (no bookings, channels only): Gym, Running, Cycling, Swimming, Yoga & Pilates, Meditation, Book Club. Clubs are built by members through channels.

Booking limits per category (editable in the portal, Settings > Categories; an activity can override in Rules):

| Category | People | Post at least ahead | Post at most ahead | Joining closes | Longest |
|---|---|---|---|---|---|
| Sports | 6 (Volleyball, Basketball 20; Football/Futsal, Cricket 30) | 6 h | 2 days | 2 h before | 2 h |
| Outdoors & travel | 30 | 1 week | 30 days | 3 days before | 48 h |
| Food, drinks & nightlife | 20 | 8 h | 3 days | 4 h before | 4 h |
| Music & performance | 20 | 8 h | 3 days | 4 h before | 4 h |
| Games & watch parties | 6 (Board Games, Escape Rooms 8; Quizzing & Trivia 20; Match Watch Parties 30) | 6 h | 2 days | 2 h before | 5 h |
| Culture, learning & causes | 20 | 8 h | 3 days | 4 h before | 6 h |

A host may close joining earlier than the default, never later. The database enforces all of it (`create_booking`, `join_booking`, `set_booking_close_hours`); `booking_limits(activity)` tells the app what to offer. Hosts can also set a minimum reliability (5+ to 9+), and members can filter bookings by it.

Lobbies are the member's own choice: picking an interest adds its Lobby, but changing interests never removes one. Any Lobby can be joined or left from "Browse all lobbies". Interests (3 to 5) remain a profile tag and the starting set of Lobbies. Members whose old activities were retired see a prompt to choose at least 3.

## Home (the opening tab)
Tabs: Home, Events, Bookings, Chats, Profile. Home shows, top to bottom: a time-of-day greeting; Coming up (your next bookings and events as colour cards, or a prompt to find a booking); Your lobbies (with unread counts); Starting soon (open bookings, those in your interests first, skipping full, closed and your own); one upcoming event you have not joined; Pick up where you left off (up to three chats with unread messages). There are no people suggestions. Pull to refresh; it reloads each time you return to it. Logic lives in `app/src/lib/home.ts` (tested).
