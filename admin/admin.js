'use strict';
// The Semi Circle admin portal. A static page that talks to Supabase as the signed-in admin.
// Every action is a database function or table that only admins may use; this page is just the screen on top.
const SUPABASE_URL = 'https://qjtuahvhszxektzdmmdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdHVhaHZoc3p4ZWt0emRtbWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzkzNDUsImV4cCI6MjEwNTc1NTM0NX0.Blt9FzDgZq_BgoraEraJVZwMcIEtZh7oXkrNWm-N-aQ';
const REQUIRE_MFA = false; // authenticator-app step is switched off for now: email and password only
if (!window.supabase) { document.getElementById('app').textContent = 'The admin page could not load its sign-in library. Check your connection and refresh.'; throw new Error('supabase library missing'); }
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sc-admin-session' } });

const CITIES = ['Delhi', 'Gurgaon', 'Noida', 'Greater Noida', 'Faridabad', 'Ghaziabad'];
const GENDERS = [['male', 'Male'], ['female', 'Female'], ['non_binary', 'Non-binary'], ['prefer_not_to_say', 'Prefer not to say']];
const IST = 'Asia/Kolkata';

/* ---------- small helpers ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid))); // text only: nothing from the database is ever parsed as HTML
  }
  return el;
}
const $app = () => document.getElementById('app');
const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);

function toast(msg, isErr) {
  const t = h('div', { class: 'toast' + (isErr ? ' err' : '') }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), isErr ? 7000 : 3500);
}

const ERRORS = {
  not_allowed: "You don't have permission to do that.", title_invalid: 'The title needs 3 to 120 characters.', time_invalid: 'The end has to be after the start.',
  capacity_invalid: 'Capacity must be at least 1.', price_invalid: 'The price cannot be negative.', age_invalid: 'Ages run from 18 up, and the oldest must not be below the youngest.',
  min_score_invalid: 'The reliability score is between 0 and 10.', capacity_below_going: 'More people have already reserved than that capacity.',
  event_locked: 'A cancelled or completed event cannot be edited.', status_invalid: 'That change is not allowed for this event.', ticket_not_found: 'No ticket with that code for this event.', booking_not_started: 'That booking has not started yet.',
  ticket_not_valid: 'That ticket is not valid (cancelled or on the waitlist).', not_joined: 'That member has not reserved a spot.', conflict_of_interest: 'You cannot act on your own case.',
  ticket_invalid: 'Each ticket needs a name and a price (and a whole number for how many).', refund_rules_invalid: 'Refund rules need hours before the event (0 or more) and a percentage from 0 to 100.',
  promo_code_invalid: 'Promo codes are 3 to 20 letters, numbers, dash or underscore.', promo_exists: 'That promo code already exists.', promo_value_invalid: 'Enter a discount above 0 (percent up to 100).',
  refund_not_possible: 'That payment cannot be refunded.', refund_amount_invalid: 'The refund amount is not valid.', payment_not_found: 'No paid payment found.', payments_not_configured: 'Razorpay keys are not set up yet.',
  rule_key_invalid: 'That setting does not exist.', rule_value_invalid: 'Enter a number, 0 or more.',
  already_resolved: 'That report was already resolved.', interest_exists: 'That activity already exists.', message_invalid: 'Title up to 80 characters, message up to 500 (2000 for a lobby message).', image_invalid: 'That image could not be used.', channel_not_found: 'No lobby found to post in.',
};
const friendlyError = (e) => ERRORS[e && e.message] || (e && e.message) || 'Something went wrong.';

async function rpc(fn, args) { const { data, error } = await sb.rpc(fn, args); if (error) throw error; return data; }
async function rows(q) { const { data, error } = await q; if (error) throw error; return data; }

const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: IST, dateStyle: 'medium', timeStyle: 'short' });
const fmtDate = (iso) => (iso ? fmt.format(new Date(iso)) : '');
const toInput = (iso) => (iso ? new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 16) : ''); // IST wall clock for <input type=datetime-local>
const fromInput = (v) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);

function modal(build) {
  return new Promise((resolve) => {
    const back = h('div', { class: 'modal-back', role: 'dialog', 'aria-modal': 'true' });
    const close = (v) => { back.remove(); resolve(v); };
    back.append(h('div', { class: 'modal' }, build(close)));
    back.addEventListener('click', (e) => { if (e.target === back) close(null); });
    document.body.append(back);
    const first = back.querySelector('input,textarea,button'); if (first) first.focus();
  });
}
const confirmBox = (title, text, okLabel = 'Confirm', danger = false) => modal((close) => [
  h('h2', { style: 'margin-top:0' }, title), h('p', { class: 'muted' }, text),
  h('div', { class: 'row' }, h('button', { class: danger ? 'primary danger' : 'primary', on: { click: () => close(true) } }, okLabel), h('button', { on: { click: () => close(false) } }, 'Cancel')),
]).then((v) => !!v);
const promptBox = (title, label, opts = {}) => modal((close) => {
  const input = opts.long ? h('textarea', { id: 'pb' }) : h('input', { id: 'pb', type: opts.type || 'text', value: opts.value || '' });
  return [h('h2', { style: 'margin-top:0' }, title), h('label', { class: 'f', for: 'pb' }, label), input,
    h('div', { class: 'row', style: 'margin-top:14px' },
      h('button', { class: 'primary', on: { click: () => { if (opts.required && !input.value.trim()) { input.focus(); return; } close(input.value); } } }, opts.ok || 'Save'),
      h('button', { on: { click: () => close(null) } }, 'Cancel'))];
});

const table = (headers, body) => h('div', { class: 'scroll' }, h('table', null, h('thead', null, h('tr', null, headers.map((x) => h('th', null, x)))), h('tbody', null, body)));
const tr = (cells) => h('tr', null, cells.map((c) => h('td', null, c)));
const badge = (t, kind) => h('span', { class: 'badge' + (kind ? ' ' + kind : '') }, t);

function csv(filename, header, data) {
  const cell = (v) => { let s = v == null ? '' : String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }; // keeps spreadsheets from running a cell as a formula
  const text = [header, ...data].map((r) => r.map(cell).join(',')).join('\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'text/csv' })), download: filename });
  document.body.append(a); a.click(); a.remove();
}

/* ---------- sign in, second step, admin check ---------- */
function loginScreen(msg) {
  const email = h('input', { id: 'em', type: 'email', autocomplete: 'username', required: true });
  const pw = h('input', { id: 'pw', type: 'password', autocomplete: 'current-password', required: true });
  const err = h('p', { class: 'error', role: 'alert' }, msg || '');
  const go = h('button', { class: 'primary', type: 'submit' }, 'Sign in');
  const form = h('form', { class: 'login', on: { submit: async (ev) => {
    ev.preventDefault(); go.disabled = true; err.textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value });
    go.disabled = false;
    if (error) { err.textContent = 'That email and password do not match.'; return; }
    await gate();
  } } },
    h('div', { class: 'brand' }, 'The Semi Circle'), h('p', { class: 'muted' }, 'Admin sign in'),
    h('label', { class: 'f', for: 'em' }, 'Email'), email, h('label', { class: 'f', for: 'pw' }, 'Password'), pw, err, h('div', { style: 'margin-top:12px' }, go));
  clear($app()).append(form); email.focus();
}

async function mfaScreen() {
  const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.currentLevel === 'aal2') return true;
  const { data: factors } = await sb.auth.mfa.listFactors();
  const totp = factors && factors.totp && factors.totp[0];
  const err = h('p', { class: 'error', role: 'alert' });
  const code = h('input', { id: 'code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', placeholder: '6-digit code' });
  let factorId = totp && totp.id, qr = null, secret = null;
  if (!factorId) {
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Admin ' + new Date().toISOString() });
    if (error) { clear($app()).append(h('div', { class: 'login' }, h('h1', null, 'Second step unavailable'), h('p', { class: 'error' }, 'Authenticator codes could not be set up: ' + error.message), h('p', { class: 'muted' }, 'Turn on multi-factor authentication (TOTP) in the Supabase dashboard under Authentication, then try again.'), h('button', { on: { click: signOut } }, 'Sign out'))); return false; }
    factorId = data.id; qr = data.totp.qr_code; secret = data.totp.secret;
  }
  return new Promise((resolve) => {
    const go = h('button', { class: 'primary', type: 'submit' }, 'Verify');
    clear($app()).append(h('form', { class: 'login', on: { submit: async (ev) => {
      ev.preventDefault(); go.disabled = true; err.textContent = '';
      const ch = await sb.auth.mfa.challenge({ factorId });
      if (ch.error) { err.textContent = ch.error.message; go.disabled = false; return; }
      const v = await sb.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: code.value.trim() });
      go.disabled = false;
      if (v.error) { err.textContent = 'That code is wrong or expired. Try the next one.'; return; }
      resolve(true);
    } } },
      h('div', { class: 'brand' }, 'The Semi Circle'),
      qr ? [h('p', null, 'Scan this with an authenticator app (Google Authenticator, 1Password, Authy), then enter the code it shows.'), h('img', { class: 'qr', src: qr, alt: 'Authenticator setup QR code' }), h('p', { class: 'faint' }, 'Cannot scan? Enter this key by hand: ', h('code', null, secret))]
         : h('p', { class: 'muted' }, 'Enter the 6-digit code from your authenticator app.'),
      h('label', { class: 'f', for: 'code' }, 'Code'), code, err, h('div', { class: 'row', style: 'margin-top:12px' }, go, h('button', { type: 'button', on: { click: signOut } }, 'Sign out'))));
    code.focus();
  });
}

async function signOut() { await sb.auth.signOut(); loginScreen(); }

async function gate() {
  try {
    if (REQUIRE_MFA && !(await mfaScreen())) return;
    const admin = await rpc('is_admin');
    if (!admin) { await sb.auth.signOut(); loginScreen('That account is not an admin.'); return; }
    const { data } = await sb.auth.getUser();
    startShell(data.user);
  } catch (e) { loginScreen(friendlyError(e)); }
}

/* ---------- shell and routing ---------- */
const PAGES = [['dashboard', 'Dashboard'], ['applicants', 'Applicants'], ['members', 'Members'], ['reports', 'Reports'], ['events', 'Events'], ['payments', 'Payments'], ['promos', 'Promo codes'], ['announce', 'Announcements'], ['bookings', 'Bookings'], ['settings', 'Settings'], ['log', 'Activity log']];
let counts = {};

async function startShell(user) {
  const main = h('main', { id: 'main', tabindex: '-1' });
  const nav = h('nav', { class: 'side', 'aria-label': 'Admin' });
  clear($app()).append(h('div', { class: 'layout' }, nav, main));
  const paintNav = () => {
    put(nav, h('div', { class: 'brand' }, 'The Semi ', h('b', null, 'Circle')),
      PAGES.map(([id, label]) => {
        const n = id === 'applicants' ? counts.applicants_pending : id === 'reports' ? counts.reports_open : 0;
        return h('a', { href: '#/' + id, 'aria-current': currentPage() === id ? 'page' : null }, label, n ? h('span', { class: 'count' }, n) : null);
      }),
      h('div', { class: 'who' }, user.email, h('div', null, h('button', { class: 'small', style: 'margin-top:8px', on: { click: signOut } }, 'Sign out'))));
  };
  const route = async () => {
    paintNav();
    put(main, h('p', { class: 'muted' }, 'Loading…'));
    try { await (renderers[currentPage()] || renderers.dashboard)(main, subPath()); } catch (e) { put(main, h('h1', null, 'Something went wrong'), h('p', { class: 'error' }, friendlyError(e))); }
    main.focus();
  };
  window.addEventListener('hashchange', route);
  try { counts = await rpc('admin_overview'); } catch { counts = {}; }
  if (!location.hash) location.hash = '#/dashboard'; else route();
}
const currentPage = () => (location.hash.replace(/^#\//, '').split('/')[0] || 'dashboard');
const subPath = () => location.hash.replace(/^#\//, '').split('/').slice(1);
const refresh = () => window.dispatchEvent(new Event('hashchange'));

const header = (title, sub) => h('div', { style: 'display:contents' }, h('h1', null, title), sub ? h('p', { class: 'muted' }, sub) : null);
// append() would print a bare array as text, so every page body goes through put()
const put = (el, ...kids) => clear(el).append(...kids.flat(Infinity).filter((k) => k != null && k !== false));
const tabs = (items, current, on) => h('div', { class: 'tabs', role: 'group' }, items.map(([v, l]) => h('button', { class: 'tab', 'aria-pressed': String(v === current), on: { click: () => on(v) } }, l)));
async function act(fn, okMsg) { try { const r = await fn(); if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg); return true; } catch (e) { toast(friendlyError(e), true); return false; } }

const renderers = {};

/* ---------- dashboard ---------- */
renderers.dashboard = async (main) => {
  const c = await rpc('admin_overview'); counts = c || {};
  const card = (label, n, href, alert) => h('a', { class: 'card' + (alert && n ? ' alert' : ''), href }, h('div', { class: 'n' }, n ?? 0), h('div', { class: 'l' }, label));
  put(main, header('Dashboard', 'What needs you today.'),
    h('div', { class: 'cards' },
      card('Applicants waiting', c.applicants_pending, '#/applicants', true), card('Fast-track waiting', c.fast_track_waiting, '#/applicants', true),
      card('Open reports', c.reports_open, '#/reports', true), card('Safety reports', c.safety_reports_open, '#/reports', true),
      card('Interest suggestions', c.interest_suggestions_pending, '#/settings/suggestions', true), card('Low-score members', c.low_score_members, '#/members'),
      card('Active members', c.members_active, '#/members'), card('Suspended or banned', c.members_restricted, '#/members'),
      card('Upcoming bookings', c.bookings_upcoming, '#/bookings'), card('Accepted applicants', c.applicants_accepted, '#/applicants')));
};

// Emails the applicant that they are accepted (done by a Supabase function that sends through Resend).
async function sendAcceptance(a, resend) {
  const { data, error } = await sb.functions.invoke('send-acceptance', { body: { applicant_id: a.id, resend } });
  let code = data && data.error;
  if (error) { try { code = (await error.context.json()).error; } catch { code = 'email_failed'; } }
  if (code) { toast('Accepted, but the email was not sent: ' + (EMAIL_ERRORS[code] || code), true); return; }
  if (data && data.already) toast('They were already emailed.'); else toast('Acceptance email sent to ' + a.personal_email);
}
const EMAIL_ERRORS = { email_not_configured: 'the Resend key is not set in Supabase yet', email_failed: 'Resend refused it', not_accepted: 'they are not accepted', not_allowed: 'not allowed' };

/* ---------- applicants ---------- */
renderers.applicants = async (main, sub) => {
  const status = sub[0] || 'pending';
  const all = await rows(sb.from('admin_applicants_queue').select('*').order('created_at', { ascending: false }).limit(500));
  const list = all.filter((a) => a.status === status);
  const set = (id, s, msg) => async () => { if (await act(() => rpc('review_applicant', { p_applicant: id, p_status: s }), msg)) refresh(); };
  const accept = (a) => async () => {
    if (!(await confirmBox('Accept ' + a.full_name + '?', 'They get full access the next time they open the app, and we email them to say so.', 'Accept'))) return;
    if (!(await act(() => rpc('accept_applicant', { p_applicant: a.id }), 'Accepted'))) return;
    await sendAcceptance(a, false);
    refresh();
  };
  put(main, header('Applicants', all.length + ' in the queue'),
    tabs([['pending', 'Pending'], ['shortlisted', 'Shortlisted'], ['accepted', 'Accepted'], ['rejected', 'Rejected']], status, (v) => { location.hash = '#/applicants/' + v; }),
    list.length ? table(['Name', 'Contact', 'City', 'Work email', 'Signals', 'Applied', ''], list.map((a) => tr([
      h('div', null, a.full_name, a.fast_track ? [' ', badge('fast track', 'ok')] : null),
      h('div', null, a.phone, h('div', { class: 'faint' }, a.personal_email)),
      a.city, h('div', null, a.work_email, ' ', badge(a.work_email_verified ? 'verified' : 'unverified', a.work_email_verified ? 'ok' : null)),
      h('div', { class: 'faint' }, a.linkedin_url && safeUrl(a.linkedin_url) ? h('a', { href: safeUrl(a.linkedin_url), target: '_blank', rel: 'noopener noreferrer' }, 'LinkedIn') : 'no LinkedIn', h('br'), a.referred_by_name ? 'Referred by ' + a.referred_by_name : 'No referrer', a.vouches_total ? ' · ' + a.vouches_total + ' vouches' : ''),
      fmtDate(a.created_at),
      h('div', { class: 'row' },
        a.status !== 'accepted' ? h('button', { class: 'small primary', on: { click: accept(a) } }, 'Accept') : null,
        a.status === 'pending' ? h('button', { class: 'small', on: { click: set(a.id, 'shortlisted', 'Shortlisted') } }, 'Shortlist') : null,
        a.status !== 'rejected' && a.status !== 'accepted' ? h('button', { class: 'small danger', on: { click: async () => { if (await confirmBox('Reject ' + a.full_name + '?', 'They will see that their application was not accepted.', 'Reject', true)) set(a.id, 'rejected', 'Rejected')(); } } }, 'Reject') : null,
        a.status === 'rejected' ? h('button', { class: 'small', on: { click: set(a.id, 'pending', 'Moved back to pending') } }, 'Reopen') : null,
        a.status === 'accepted' ? h('button', { class: 'small', on: { click: async () => { await sendAcceptance(a, true); } } }, 'Resend email') : null),
    ]))) : h('p', { class: 'muted' }, 'Nobody here.'));
};

/* ---------- members ---------- */
renderers.members = async (main, sub) => {
  const state = sub[0] || 'active';
  const all = await rows(sb.from('admin_members').select('*').order('created_at', { ascending: false }).limit(1000));
  const q = { v: '' };
  const body = h('div');
  const paint = () => {
    const list = all.filter((m) => (state === 'all' || m.state === state) && (!q.v || [m.username, m.full_name, m.work_email].some((x) => (x || '').toLowerCase().includes(q.v))));
    clear(body).append(list.length ? table(['Member', 'Role', 'Area', 'State', 'Score', 'Joined', ''], list.map((m) => tr([
      h('div', null, m.full_name || '—', h('div', { class: 'faint' }, '@' + (m.username || '?') + ' · ' + (m.work_email || ''))), m.role, m.area,
      h('div', null, badge(m.state, m.state === 'active' ? 'ok' : null), m.suspended_until ? h('div', { class: 'faint' }, 'until ' + fmtDate(m.suspended_until)) : null),
      m.score == null ? '—' : Number(m.score).toFixed(1), fmtDate(m.created_at),
      h('div', { class: 'row' },
        h('button', { class: 'small', on: { click: () => moderate(m, 'warning') } }, 'Warn'),
        h('button', { class: 'small', on: { click: () => moderate(m, 'suspension') } }, 'Suspend'),
        h('button', { class: 'small danger', on: { click: () => moderate(m, 'ban') } }, 'Ban'),
        m.state === 'suspended' || m.state === 'banned' ? h('button', { class: 'small', on: { click: async () => { if (await confirmBox('Lift restriction on @' + m.username + '?', 'They regain access straight away.', 'Lift')) { if (await act(() => rpc('lift_moderation', { p_member: m.id }), 'Lifted')) refresh(); } } } }, 'Lift') : null),
    ]))) : h('p', { class: 'muted' }, 'No members match.'));
  };
  const moderate = async (m, action) => {
    const reason = await promptBox(({ warning: 'Warn', suspension: 'Suspend', ban: 'Ban' })[action] + ' @' + m.username, 'Reason (kept in the log)', { long: true, required: true, ok: 'Apply' });
    if (reason == null) return;
    let days = null;
    if (action === 'suspension') { const d = await promptBox('Suspend for how many days?', 'Days (1 to 365)', { type: 'number', value: '7', required: true, ok: 'Suspend' }); if (d == null) return; days = parseInt(d, 10); }
    if (await act(() => rpc('apply_moderation', { p_member: m.id, p_action: action, p_reason: reason, p_days: days }), 'Done')) refresh();
  };
  const search = h('input', { type: 'search', placeholder: 'Search name, username, work email', 'aria-label': 'Search members', on: { input: (e) => { q.v = e.target.value.trim().toLowerCase(); paint(); } } });
  put(main, header('Members', all.length + ' total'), tabs([['active', 'Active'], ['suspended', 'Suspended'], ['banned', 'Banned'], ['all', 'All']], state, (v) => { location.hash = '#/members/' + v; }), h('div', { style: 'margin:12px 0' }, search), body);
  paint();
};

/* ---------- reports ---------- */
renderers.reports = async (main, sub) => {
  const which = sub[0] || 'open';
  const all = await rows(sb.from('admin_reports_queue').select('*').order('created_at', { ascending: false }).limit(300));
  const list = all.filter((r) => (which === 'open' ? r.status === 'open' : r.status !== 'open'));
  const resolve = async (r, outcome, label) => { if (await confirmBox(label + '?', 'Report against @' + r.reported_username + '. This updates their reliability score and may restrict their account.', label, outcome !== 'dismissed')) { if (await act(() => rpc('resolve_report', { p_report: r.id, p_outcome: outcome }), (x) => 'Result: ' + x)) refresh(); } };
  put(main, header('Reports'), tabs([['open', 'Open'], ['done', 'Resolved']], which, (v) => { location.hash = '#/reports/' + v; }),
    list.length ? table(['Against', 'From', 'Category', 'Reason', 'History', 'When', ''], list.map((r) => tr([
      h('div', null, '@' + r.reported_username, ' ', r.is_safety ? badge('safety') : null, h('div', { class: 'faint' }, r.reported_state)),
      '@' + r.reporter_username, r.category, h('div', { style: 'max-width:280px;white-space:pre-wrap' }, r.reason || ''),
      h('div', { class: 'faint' }, r.prior_upheld + ' upheld before · score ' + (r.reported_score == null ? '—' : Number(r.reported_score).toFixed(1))), fmtDate(r.created_at),
      r.status === 'open' ? h('div', { class: 'row' }, h('button', { class: 'small', on: { click: () => resolve(r, 'dismissed', 'Dismiss') } }, 'Dismiss'), h('button', { class: 'small', on: { click: () => resolve(r, 'upheld_minor', 'Uphold (minor)') } }, 'Minor'), h('button', { class: 'small danger', on: { click: () => resolve(r, 'upheld_severe', 'Uphold (severe)') } }, 'Severe')) : badge(r.status.replace('_', ' ')),
    ]))) : h('p', { class: 'muted' }, 'Nothing here.'));
};

/* ---------- events ---------- */
renderers.events = async (main, sub) => {
  if (sub[0] === 'new') return eventForm(main, null);
  if (sub[0] && sub[1] === 'edit') return eventForm(main, sub[0]);
  if (sub[0]) return eventDetail(main, sub[0]);
  const list = await rpc('admin_events');
  const tone = { published: 'ok' };
  put(main, h('div', { class: 'row', style: 'justify-content:space-between' }, header('Events', 'Events we host. Members see published ones in the app.'), h('a', { class: 'btn primary', href: '#/events/new' }, 'New event')),
    list.length ? table(['Event', 'When', 'Status', 'Going', 'Waitlist', 'Attended', 'Price'], list.map((e) => tr([
      h('a', { href: '#/events/' + e.id }, e.title), fmtDate(e.starts_at), badge(e.status, tone[e.status]),
      e.going + (e.capacity ? ' / ' + e.capacity : ''), e.waitlist, e.attended + (e.no_show ? ' (' + e.no_show + ' no-show)' : ''), Number(e.price_inr) ? 'from ' + inr(e.price_inr) : 'Free',
    ]))) : h('p', { class: 'muted' }, 'No events yet.'));
};

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ticket types: name, price in rupees, how many (blank = no limit)
function ticketEditor(initial) {
  const rows = []; const box = h('div');
  const addRow = (t = {}) => {
    const name = h('input', { placeholder: 'Ticket name, e.g. Early bird', value: t.name || '', maxlength: '40', 'aria-label': 'Ticket name', style: 'flex:1;min-width:150px' });
    const price = h('input', { type: 'number', min: '0', step: '1', placeholder: '₹ price', value: t.price_inr ?? '', 'aria-label': 'Price in rupees', style: 'max-width:110px' });
    const qty = h('input', { type: 'number', min: '1', step: '1', placeholder: 'No limit', value: t.quantity ?? '', 'aria-label': 'How many are available', style: 'max-width:110px' });
    const row = { id: t.id || null, name, price, qty, el: null };
    row.el = h('div', { class: 'row', style: 'gap:8px;margin-bottom:8px;flex-wrap:wrap' }, name, price, qty, t.sold ? h('span', { class: 'faint' }, t.sold + ' sold') : null,
      h('button', { type: 'button', class: 'small', on: { click: () => { rows.splice(rows.indexOf(row), 1); row.el.remove(); } } }, 'Remove'));
    rows.push(row); box.append(row.el);
  };
  (initial || []).forEach(addRow);
  const el = h('div', null, h('p', { class: 'faint' }, 'Name, price in rupees, and how many are available (blank = no limit). Leave empty for a free event. Members pick one when they buy.'), box,
    h('button', { type: 'button', class: 'small', on: { click: () => addRow() } }, 'Add a ticket type'));
  return { el, value: () => rows.map((r) => ({ id: r.id, name: r.name.value, price_inr: Number(r.price.value || 0), quantity: r.qty.value === '' ? null : Number(r.qty.value) })) };
}

// refund rules: cancelling at least N hours before the start returns P% of the price; the most generous rule that applies wins
function refundEditor(initial) {
  const rows = []; const box = h('div');
  const addRow = (r = {}) => {
    const hours = h('input', { type: 'number', min: '0', step: '1', value: r.hours_before ?? '', 'aria-label': 'Hours before the event', style: 'max-width:90px' });
    const pct = h('input', { type: 'number', min: '0', max: '100', step: '1', value: r.percent ?? '', 'aria-label': 'Percent refunded', style: 'max-width:90px' });
    const row = { hours, pct, el: null };
    row.el = h('div', { class: 'row', style: 'gap:8px;margin-bottom:8px;align-items:center' }, 'Cancel at least', hours, 'hours before: refund', pct, '%',
      h('button', { type: 'button', class: 'small', on: { click: () => { rows.splice(rows.indexOf(row), 1); row.el.remove(); } } }, 'Remove'));
    rows.push(row); box.append(row.el);
  };
  const setAll = (list) => { rows.splice(0).forEach((r) => r.el.remove()); list.forEach(addRow); };
  (initial || []).forEach(addRow);
  const preset = (label, list) => h('button', { type: 'button', class: 'small', on: { click: () => setAll(list) } }, label);
  const el = h('div', null, h('p', { class: 'faint' }, 'When a member cancels, they get back the percentage of the rule that fits. Cancelling later than every rule returns nothing. No rules means no refunds.'), box,
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, h('button', { type: 'button', class: 'small', on: { click: () => addRow() } }, 'Add a rule'),
      preset('No refunds', []), preset('Full until 48 h, half until 24 h', [{ hours_before: 48, percent: 100 }, { hours_before: 24, percent: 50 }]), preset('Full until 24 h', [{ hours_before: 24, percent: 100 }])));
  return { el, value: () => rows.filter((r) => r.hours.value !== '' && r.pct.value !== '').map((r) => ({ hours_before: Number(r.hours.value), percent: Number(r.pct.value) })) };
}

// the admin portal talks to the payments function as the signed-in admin
async function refundVia(body) {
  const { data, error } = await sb.functions.invoke('payments?action=refund', { body });
  if (error) { let m = error.message; try { const j = await error.context.json(); m = j.error || m; } catch (_) {} throw new Error(m); }
  return data;
}

async function eventForm(main, id) {
  const interests = await rows(sb.from('interests').select('id,name').eq('is_active', true).order('name'));
  const e = id ? await rpc('admin_event_get', { p_id: id }) : { genders: [], cities: [], tickets: [], refund_rules: [] };
  const tix = ticketEditor((e.tickets && e.tickets.length) ? e.tickets : (Number(e.price_inr) > 0 ? [{ name: 'General', price_inr: e.price_inr }] : []));
  const refunds = refundEditor(e.refund_rules || []);
  let cover = e.cover_path || '';
  const f = {};
  const inp = (key, label, attrs = {}, tag = 'input') => { f[key] = h(tag, { id: 'f-' + key, ...attrs }); return h('div', null, h('label', { class: 'f', for: 'f-' + key }, label), f[key]); };
  const sel = h('select', { id: 'f-interest' }, h('option', { value: '' }, 'None (open to all)'), interests.map((i) => h('option', { value: i.id, selected: i.id === e.interest_id }, i.name)));
  const gend = GENDERS.map(([v, l]) => [v, l, h('input', { type: 'checkbox', value: v, checked: (e.genders || []).includes(v) })]);
  const cityBoxes = CITIES.map((c) => [c, h('input', { type: 'checkbox', value: c, checked: (e.cities || []).includes(c) })]);
  const coverNote = h('p', { class: 'faint' }, cover ? 'Cover image set.' : 'No cover image.');
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Cover image', on: { change: async () => {
    const fl = file.files[0]; if (!fl) return;
    if (fl.size > 5 * 1024 * 1024) { toast('Pick an image under 5 MB.', true); return; }
    const ext = fl.type === 'image/png' ? 'png' : fl.type === 'image/webp' ? 'webp' : 'jpg';
    const path = crypto.randomUUID() + '.' + ext;
    const { error } = await sb.storage.from('event-covers').upload(path, fl, { contentType: fl.type });
    if (error) { toast('Upload failed: ' + error.message, true); return; }
    cover = path; coverNote.textContent = 'Cover uploaded. Save the event to keep it.';
  } } });
  const err = h('p', { class: 'error', role: 'alert' });
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const save = h('button', { class: 'primary', type: 'submit' }, id ? 'Save changes' : 'Create draft');
  const form = h('form', { class: 'panel', on: { submit: async (ev) => {
    ev.preventDefault(); err.textContent = ''; save.disabled = true;
    const p = { id: id || null, title: f.title.value, description: f.description.value, interest_id: sel.value || null, cover_path: cover || null, venue_name: f.venue.value, area: f.area.value, city: f.city.value, address_text: f.address.value,
      starts_at: fromInput(f.starts.value), ends_at: fromInput(f.ends.value), capacity: num(f.capacity.value), price_inr: 0, tickets: tix.value(), refund_rules: refunds.value(), age_min: num(f.amin.value), age_max: num(f.amax.value), min_score: num(f.score.value),
      genders: gend.filter((g) => g[2].checked).map((g) => g[0]), cities: cityBoxes.filter((c) => c[1].checked).map((c) => c[0]) };
    try { const newId = await rpc('admin_save_event', { p }); toast('Saved'); location.hash = '#/events/' + newId; } catch (x) { err.textContent = friendlyError(x); }
    save.disabled = false;
  } } },
    inp('title', 'Title', { value: e.title || '', maxlength: '120', required: true }),
    inp('description', 'Description', { rows: '5', maxlength: '2000' }, 'textarea'),
    h('label', { class: 'f', for: 'f-interest' }, 'Activity'), sel,
    h('div', { class: 'grid2' }, inp('starts', 'Starts (IST)', { type: 'datetime-local', value: toInput(e.starts_at), required: true }), inp('ends', 'Ends (IST)', { type: 'datetime-local', value: toInput(e.ends_at), required: true })),
    h('div', { class: 'grid2' }, inp('venue', 'Venue', { value: e.venue_name || '' }), inp('area', 'Area', { value: e.area || '' })),
    h('div', { class: 'grid2' }, inp('city', 'City', { value: e.city || '' }), inp('address', 'Full address (shown after reserving)', { value: e.address_text || '' })),
    h('div', { class: 'grid2' }, inp('capacity', 'Capacity in total (blank = unlimited)', { type: 'number', min: '1', value: e.capacity ?? '' })),
    h('h3', null, 'Tickets and prices'), tix.el,
    h('h3', null, 'Refunds'), refunds.el,
    h('h3', null, 'Who can join'),
    h('div', { class: 'grid2' }, inp('amin', 'Minimum age', { type: 'number', min: '18', value: e.age_min ?? '' }), inp('amax', 'Maximum age', { type: 'number', min: '18', value: e.age_max ?? '' })),
    inp('score', 'Minimum reliability score (0 to 10)', { type: 'number', min: '0', max: '10', step: '0.1', value: e.min_score ?? '' }),
    h('label', { class: 'f' }, 'Genders (none ticked = everyone)'), h('div', { class: 'checks' }, gend.map(([v, l, box]) => h('label', null, box, ' ' + l))),
    h('label', { class: 'f' }, 'Cities (none ticked = anywhere)'), h('div', { class: 'checks' }, cityBoxes.map(([c, box]) => h('label', null, box, ' ' + c))),
    h('label', { class: 'f', for: 'cover' }, 'Cover image'), h('div', null, file), coverNote,
    err, h('div', { class: 'row', style: 'margin-top:14px' }, save, h('a', { class: 'btn', href: id ? '#/events/' + id : '#/events' }, 'Cancel')));
  f.description.value = e.description || '';
  put(main, header(id ? 'Edit event' : 'New event'), form);
}

async function eventDetail(main, id) {
  const [e, att, pays] = await Promise.all([rpc('admin_event_get', { p_id: id }), rpc('admin_event_guests', { p_event: id }), rpc('admin_payments', { p_event: id })]);
  const going = att.filter((a) => a.status === 'going' || a.status === 'attended' || a.status === 'no_show');
  const wait = att.filter((a) => a.status === 'waitlist');
  const status = async (s, title, text, danger) => {
    let reason = null;
    if (s === 'cancelled') { reason = await promptBox(title, 'Reason (members who reserved will be told)', { long: true, ok: 'Cancel event' }); if (reason == null) return; }
    else if (!(await confirmBox(title, text, 'Yes', danger))) return;
    if (await act(() => rpc('admin_set_event_status', { p_id: id, p_status: s, p_reason: reason }), 'Updated')) refresh();
  };
  const mark = (a, s) => async () => { if (await act(() => rpc('admin_mark_rsvp', { p_event: id, p_member: a.member_id, p_status: s }), 'Marked')) refresh(); };
  const code = h('input', { placeholder: 'Ticket code', 'aria-label': 'Ticket code', style: 'max-width:200px', autocapitalize: 'characters' });
  const result = h('p', { role: 'status' });
  const checkIn = async () => {
    result.className = ''; result.textContent = '';
    try { const r = await rpc('admin_check_in', { p_event: id, p_code: code.value.trim() }); result.className = 'ok'; result.textContent = (r.result === 'already' ? 'Already checked in: ' : 'Checked in: ') + (r.full_name || '') + ' (@' + r.username + ')'; code.value = ''; code.focus(); }
    catch (x) { result.className = 'error'; result.textContent = friendlyError(x); }
  };
  const actions = [];
  if (e.status === 'draft') actions.push(h('button', { class: 'primary', on: { click: () => status('published', 'Publish this event?', 'Members will see it in the Events tab.') } }, 'Publish'));
  if (e.status === 'published') actions.push(h('button', { on: { click: () => status('completed', 'Mark as completed?', 'Closes check-in and ends the event.') } }, 'Mark completed'));
  if (e.status === 'draft' || e.status === 'published') actions.push(h('button', { class: 'danger', on: { click: () => status('cancelled', 'Cancel this event') } }, 'Cancel event'));
  if (e.status !== 'cancelled' && e.status !== 'completed') actions.push(h('a', { class: 'btn', href: '#/events/' + id + '/edit' }, 'Edit'));
  const attRows = (list) => list.map((a) => tr([h('div', null, a.full_name || '—', h('div', { class: 'faint' }, '@' + a.username)), a.phone, a.ticket_code, a.ticket_name ? a.ticket_name + (a.paid_inr != null ? ' · ' + inr(a.paid_inr) : '') : '', badge(a.status.replace('_', ' '), a.status === 'attended' ? 'ok' : null), a.checked_in_at ? fmtDate(a.checked_in_at) : '',
    h('div', { class: 'row' }, a.status !== 'attended' ? h('button', { class: 'small', on: { click: mark(a, 'attended') } }, 'Attended') : null, a.status !== 'no_show' ? h('button', { class: 'small', on: { click: mark(a, 'no_show') } }, 'No-show') : null)]));
  put(main, h('p', null, h('a', { href: '#/events' }, '← All events')), header(e.title, fmtDate(e.starts_at) + ' to ' + fmtDate(e.ends_at) + ' · ' + e.status),
    h('p', { class: 'muted', style: 'white-space:pre-wrap' }, e.description || ''), h('div', { class: 'row' }, actions),
    (() => {
      const paid = pays.filter((x) => ['paid', 'refund_pending', 'refunded', 'partially_refunded'].includes(x.status));
      if (!paid.length) return null;
      const gross = paid.reduce((n, x) => n + Number(x.amount_inr), 0), back = paid.reduce((n, x) => n + Number(x.refund_inr || 0), 0);
      const due = paid.filter((x) => x.status === 'paid' || x.status === 'refund_pending').length;
      return h('div', { class: 'panel' }, h('h3', null, 'Money'), h('p', null, paid.length + ' payments · ' + inr(gross) + ' taken · ' + inr(back) + ' refunded · ' + inr(gross - back) + ' kept'),
        e.status === 'cancelled' && due ? h('button', { class: 'danger', on: { click: async () => {
          if (!(await confirmBox('Refund every paid ticket?', 'All ' + due + ' paid tickets for this event are refunded in full through Razorpay.', 'Refund all', true))) return;
          if (await act(async () => { const r = await refundVia({ event_id: id }); if (r.failed) throw new Error(r.failed + ' refunds failed. Try again from Payments.'); }, 'Refunds sent')) refresh();
        } } }, 'Refund all paid tickets') : null, h('p', null, h('a', { href: '#/payments/' + id }, 'See every payment for this event')));
    })(),
    e.status === 'published' ? h('div', { class: 'panel' }, h('h3', null, 'Check in'), h('div', { class: 'row' }, code, h('button', { class: 'primary', on: { click: checkIn } }, 'Check in')), result) : null,
    h('h3', null, 'Reserved (' + going.length + (e.capacity ? ' of ' + e.capacity : '') + ')'),
    going.length ? table(['Member', 'Phone', 'Code', 'Ticket', 'Status', 'Checked in', ''], attRows(going)) : h('p', { class: 'muted' }, 'No reservations yet.'),
    wait.length ? [h('h3', null, 'Waitlist (' + wait.length + ')'), table(['Member', 'Phone', 'Code', 'Ticket', 'Status', '', ''], attRows(wait))] : null,
    att.length ? h('p', null, h('button', { on: { click: () => csv('event-' + id.slice(0, 8) + '.csv', ['Name', 'Username', 'Phone', 'Email', 'Status', 'Ticket code', 'Ticket', 'Paid (₹)', 'Joined', 'Checked in'], att.map((a) => [a.full_name, a.username, a.phone, a.email, a.status, a.ticket_code, a.ticket_name, a.paid_inr, a.joined_at, a.checked_in_at])) } }, 'Download attendee list (CSV)')) : null);
  code.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') checkIn(); });
}

/* ---------- payments: every ticket sale, with refunds and totals ---------- */
renderers.payments = async (main, sub) => {
  const evId = sub[0] || null;
  const all = await rpc('admin_payments', { p_event: evId });
  const events = await rpc('admin_events');
  const title = evId ? (events.find((e) => e.id === evId) || {}).title || 'Event' : 'All events';
  const taken = all.filter((x) => ['paid', 'refund_pending', 'refunded', 'partially_refunded'].includes(x.status));
  const gross = taken.reduce((n, x) => n + Number(x.amount_inr), 0), back = taken.reduce((n, x) => n + Number(x.refund_inr || 0), 0), disc = taken.reduce((n, x) => n + Number(x.discount_inr || 0), 0);
  const pick = h('select', { 'aria-label': 'Event', on: { change: () => { location.hash = '#/payments' + (pick.value ? '/' + pick.value : ''); } } }, h('option', { value: '' }, 'All events'), events.map((e) => h('option', { value: e.id, selected: e.id === evId }, e.title)));
  const tone = { paid: 'ok', refunded: null, partially_refunded: null, refund_pending: null, failed: null };
  const refund = (x) => async () => {
    const amt = await promptBox('Refund ' + inr(x.amount_inr) + ' to ' + (x.full_name || x.username) + '?', 'Amount in ₹ (full = ' + x.amount_inr + ')', { value: String(x.amount_inr), required: true, ok: 'Refund' }); if (amt == null) return;
    if (await act(async () => { const r = await refundVia({ payment_id: x.id, amount: Number(amt) }); if (r.failed) throw new Error('The refund did not go through. Try again in a moment.'); }, 'Refund sent')) refresh();
  };
  put(main, header('Payments', title), h('div', { class: 'row' }, pick),
    h('div', { class: 'panel' }, h('p', null, taken.length + ' paid tickets · ' + inr(gross) + ' taken · ' + inr(disc) + ' given as discounts · ' + inr(back) + ' refunded · ' + inr(gross - back) + ' kept')),
    all.length ? table(['When', 'Member', 'Event', 'Ticket', 'Promo', 'Paid', 'Status', 'Razorpay id', ''], all.map((x) => tr([
      fmtDate(x.paid_at || x.created_at), h('div', null, x.full_name || '—', h('div', { class: 'faint' }, '@' + x.username)), x.event_title, x.ticket_name, x.promo_code || '',
      inr(x.amount_inr) + (Number(x.discount_inr) ? ' (−' + inr(x.discount_inr) + ')' : ''), badge(x.status.replace('_', ' '), tone[x.status]) , x.razorpay_payment_id || '',
      ['paid', 'refund_pending', 'partially_refunded'].includes(x.status) ? h('button', { class: 'small', on: { click: refund(x) } }, x.status === 'refund_pending' ? 'Retry refund' : 'Refund') : null,
    ]))) : h('p', { class: 'muted' }, 'No payments yet.'),
    all.length ? h('p', null, h('button', { on: { click: () => csv('payments.csv', ['Paid at', 'Member', 'Username', 'Event', 'Ticket', 'Promo', 'List price', 'Discount', 'Paid', 'Refunded', 'Status', 'Method', 'Razorpay payment'],
      all.map((x) => [x.paid_at || x.created_at, x.full_name, x.username, x.event_title, x.ticket_name, x.promo_code, x.list_price_inr, x.discount_inr, x.amount_inr, x.refund_inr, x.status, x.method, x.razorpay_payment_id])) } }, 'Download (CSV)')) : null);
};

/* ---------- promo codes ---------- */
renderers.promos = async (main) => {
  const [list, events] = await Promise.all([rpc('admin_promos'), rpc('admin_events')]);
  const code = h('input', { placeholder: 'CODE', 'aria-label': 'Promo code', maxlength: '20', style: 'max-width:150px;text-transform:uppercase' });
  const kind = h('select', { 'aria-label': 'Type' }, h('option', { value: 'percent' }, '% off'), h('option', { value: 'amount' }, '₹ off'));
  const val = h('input', { type: 'number', min: '1', step: '1', placeholder: 'Amount', 'aria-label': 'Discount', style: 'max-width:100px' });
  const ev = h('select', { 'aria-label': 'Event' }, h('option', { value: '' }, 'Any event'), events.filter((e) => e.status === 'published' || e.status === 'draft').map((e) => h('option', { value: e.id }, e.title)));
  const max = h('input', { type: 'number', min: '1', step: '1', placeholder: 'No limit', 'aria-label': 'How many times it can be used', style: 'max-width:110px' });
  const exp = h('input', { type: 'datetime-local', 'aria-label': 'Expires (IST)' });
  const make = async () => {
    if (await act(() => rpc('admin_save_promo', { p: { code: code.value, kind: kind.value, value: Number(val.value), event_id: ev.value || null, max_uses: max.value === '' ? null : Number(max.value), expires_at: exp.value ? fromInput(exp.value) : null } }), 'Promo code created')) refresh();
  };
  const toggle = (c) => async () => { if (await act(() => rpc('admin_save_promo', { p: { id: c.id, active: !c.active } }), c.active ? 'Switched off' : 'Switched on')) refresh(); };
  put(main, header('Promo codes', 'A code takes money off a ticket. Members type it when they buy. Use ₹ off for a fixed amount, or % off.'),
    h('div', { class: 'panel' }, h('h3', null, 'New code'), h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, code, kind, val, ev, max, exp, h('button', { class: 'primary', on: { click: make } }, 'Create'))),
    list.length ? table(['Code', 'Discount', 'Event', 'Used', 'Expires', 'Status', ''], list.map((c) => tr([h('code', null, c.code), c.kind === 'percent' ? c.value + '% off' : inr(c.value) + ' off', c.event_title || 'Any event',
      c.used + (c.max_uses ? ' / ' + c.max_uses : ''), c.expires_at ? fmtDate(c.expires_at) : 'Never', badge(c.active ? 'on' : 'off', c.active ? 'ok' : null), h('button', { class: 'small', on: { click: toggle(c) } }, c.active ? 'Switch off' : 'Switch on')]))) : h('p', { class: 'muted' }, 'No promo codes yet.'));
};

/* ---------- announcements: a notification (and phone alert), a message in lobbies, and what was sent ---------- */
const IMG_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// an image picker with a preview; image.path is set once the file is uploaded to the private announcement-images bucket
function imagePicker() {
  const image = { path: null };
  const preview = h('img', { class: 'cover', alt: 'Chosen image', style: 'display:none;max-width:320px;margin-top:10px' });
  const note = h('p', { class: 'faint' }, 'Optional. JPG, PNG or WebP, up to 5 MB.');
  const clearBtn = h('button', { type: 'button', class: 'small', style: 'display:none;margin-top:8px', on: { click: () => { image.path = null; preview.style.display = 'none'; clearBtn.style.display = 'none'; file.value = ''; note.textContent = 'Optional. JPG, PNG or WebP, up to 5 MB.'; } } }, 'Remove image');
  const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Image', on: { change: async () => {
    const fl = file.files[0]; if (!fl) return;
    if (!IMG_TYPES[fl.type]) { toast('Pick a JPG, PNG or WebP image.', true); file.value = ''; return; }
    if (fl.size > 5 * 1024 * 1024) { toast('Pick an image under 5 MB.', true); file.value = ''; return; }
    note.textContent = 'Uploading…';
    const path = crypto.randomUUID() + '.' + IMG_TYPES[fl.type];
    const { error } = await sb.storage.from('announcement-images').upload(path, fl, { contentType: fl.type });
    if (error) { note.textContent = 'Upload failed: ' + error.message; image.path = null; return; }
    image.path = path; preview.src = URL.createObjectURL(fl); preview.style.display = ''; clearBtn.style.display = ''; note.textContent = 'Image ready.';
  } } });
  return { image, node: h('div', null, h('label', { class: 'f', for: 'imgfile' }, 'Image'), h('div', { id: 'imgfile' }, file), note, preview, clearBtn) };
}

renderers.announce = async (main, sub) => {
  const tab = sub[0] || 'notify';
  const bar = tabs([['notify', 'Notification'], ['lobbies', 'Lobby message'], ['sent', 'Sent']], tab, (v) => { location.hash = '#/announce/' + v; });
  if (tab === 'lobbies') return lobbyMessage(main, bar);
  if (tab === 'sent') return sentList(main, bar);
  const interests = await rows(sb.from('interests').select('id,name').eq('is_active', true).order('name'));
  const title = h('input', { id: 'at', maxlength: '80' }), body = h('textarea', { id: 'ab', maxlength: '500', rows: '4' });
  const who = h('select', { id: 'aw' }, h('option', { value: '' }, 'Every active member'), interests.map((i) => h('option', { value: i.id }, 'Members into ' + i.name)));
  const cityBoxes = CITIES.map((c) => [c, h('input', { type: 'checkbox', value: c })]);
  const push = h('input', { type: 'checkbox', id: 'apush', checked: true });
  const pic = imagePicker();
  const go = h('button', { class: 'primary', type: 'submit' }, 'Send');
  put(main, header('Announcements', 'Appears in each member\'s Activity list, and as a phone alert if you leave that on. It cannot be recalled.'), bar, h('form', { class: 'panel', on: { submit: async (ev) => {
    ev.preventDefault();
    const cities = cityBoxes.filter((c) => c[1].checked).map((c) => c[0]);
    const audience = (who.value ? who.selectedOptions[0].textContent : 'every active member') + (cities.length ? ' in ' + cities.join(', ') : '');
    if (!(await confirmBox('Send to ' + audience + '?', title.value + (push.checked ? ' (with a phone alert)' : ' (in the app only)'), 'Send'))) return;
    go.disabled = true;
    let r = null;
    const ok = await act(async () => { r = await rpc('admin_send_notification', { p_title: title.value, p_body: body.value, p_image_path: pic.image.path, p_interest_id: who.value ? Number(who.value) : null, p_cities: cities, p_send_push: push.checked }); }, () => 'Sent to ' + r.recipients + ' members');
    if (ok) {
      if (push.checked && r.recipients) { const d = await sb.functions.invoke('push-dispatch'); if (d.data && typeof d.data.sent === 'number') toast('Phone alerts sent to ' + d.data.sent + ' devices.'); }
      title.value = ''; body.value = ''; location.hash = '#/announce/sent';
    }
    go.disabled = false;
  } } },
    h('label', { class: 'f', for: 'aw' }, 'To'), who,
    h('label', { class: 'f' }, 'Only members in these cities (none ticked = all)'), h('div', { class: 'checks' }, cityBoxes.map(([c, box]) => h('label', null, box, ' ' + c))),
    h('label', { class: 'f', for: 'at' }, 'Title'), title, h('label', { class: 'f', for: 'ab' }, 'Message'), body, pic.node,
    h('div', { class: 'checks', style: 'margin-top:14px' }, h('label', null, push, ' Also send as a phone alert')),
    h('p', { class: 'faint' }, 'Members who switched off "Announcements from the team" get it in the app only. On iPhone the image shows in the app; Android phones also show it in the alert.'),
    h('div', { style: 'margin-top:12px' }, go)));
};

async function lobbyMessage(main, bar) {
  const lobbies = await rpc('admin_lobbies');
  const picked = new Set();
  let all = true;
  const body = h('textarea', { id: 'lb', maxlength: '2000', rows: '5' });
  const list = h('div', { class: 'checks', style: 'max-height:260px;overflow:auto' });
  const count = h('p', { class: 'faint' });
  const allBox = h('input', { type: 'checkbox', checked: true, id: 'lall' });
  const pic = imagePicker();
  const paint = () => {
    allBox.checked = all;
    count.textContent = all ? 'Goes to all ' + lobbies.length + ' lobbies.' : picked.size + ' of ' + lobbies.length + ' lobbies picked.';
    put(list, lobbies.map((l) => h('label', null, h('input', { type: 'checkbox', checked: all || picked.has(l.id), disabled: all, on: { change: (e) => { if (e.target.checked) picked.add(l.id); else picked.delete(l.id); paint(); } } }), ' ' + l.name + ' (' + l.members + ')')));
  };
  allBox.addEventListener('change', () => { all = allBox.checked; paint(); });
  const go = h('button', { class: 'primary', type: 'submit' }, 'Post');
  put(main, header('Announcements', 'Posted in the lobby as the admin. Members can read it but cannot reply, and it cannot be recalled.'), bar, h('form', { class: 'panel', on: { submit: async (ev) => {
    ev.preventDefault();
    if (!all && !picked.size) { toast('Pick at least one lobby.', true); return; }
    const where = all ? 'all ' + lobbies.length + ' lobbies' : picked.size + (picked.size === 1 ? ' lobby' : ' lobbies');
    if (!(await confirmBox('Post to ' + where + '?', body.value.slice(0, 200), 'Post'))) return;
    go.disabled = true;
    if (await act(() => rpc('admin_post_lobby_message', { p_body: body.value, p_channels: all ? null : [...picked], p_image_path: pic.image.path }), (n) => 'Posted in ' + n + ' lobbies')) { body.value = ''; location.hash = '#/announce/sent'; }
    go.disabled = false;
  } } }, h('label', { class: 'f', for: 'lb' }, 'Message'), body, pic.node,
    h('label', { class: 'f' }, 'Where'), h('div', { class: 'checks' }, h('label', null, allBox, ' All lobbies')), count, list, h('div', { style: 'margin-top:12px' }, go)));
  paint();
}

async function sentList(main, bar) {
  const list = await rows(sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(100));
  const who = (a) => a.kind === 'lobby' ? (a.audience.channels === 'all' ? 'All lobbies' : (a.audience.channels || []).length + ' lobbies')
    : [a.audience.interest_id ? 'one activity' : 'everyone', (a.audience.cities || []).length ? (a.audience.cities || []).join(', ') : null].filter(Boolean).join(', ');
  put(main, header('Announcements', 'Everything sent from here, newest first.'), bar, list.length ? table(['When', 'Kind', 'Message', 'To', 'Reached', 'Alert', 'Image'], list.map((a) => tr([
    fmtDate(a.created_at), badge(a.kind === 'lobby' ? 'lobby' : 'notification'),
    h('div', { style: 'max-width:340px;white-space:pre-wrap' }, a.title ? h('strong', null, a.title + ' ') : null, a.body),
    who(a), a.recipients, a.kind === 'notification' ? (a.send_push ? 'yes' : 'app only') : '', a.image_path ? 'yes' : ''
  ]))) : h('p', { class: 'muted' }, 'Nothing sent yet.'));
}

/* ---------- bookings (read only) ---------- */
renderers.bookings = async (main) => {
  const list = await rows(sb.from('bookings').select('id,title,kind,status,starts_at,area,headcount_min,headcount_max,host_id').order('starts_at', { ascending: false }).limit(200));
  const noShow = (b) => h('button', { class: 'small danger', on: { click: async () => {
    if (!(await confirmBox('Record a host no-show?', 'The host of "' + b.title + '" did not turn up. This costs them a large part of their reliability score and cannot be undone.', 'Record', true))) return;
    if (await act(async () => { const { error } = await sb.rpc('admin_record_host_no_show', { p_booking: b.id }); if (error) throw error; }, 'Recorded')) refresh();
  } } }, 'Host did not show');
  put(main, header('Bookings', 'Member-hosted plans, most recent first. If a host did not show up, record it here.'), list.length ? table(['Title', 'Kind', 'Status', 'When', 'Area', 'Size', ''], list.map((b) => tr([b.title, b.kind, badge(b.status, b.status === 'open' ? 'ok' : null), fmtDate(b.starts_at), b.area, b.headcount_min + '–' + b.headcount_max, b.kind === 'member' && b.status !== 'cancelled' && new Date(b.starts_at) < new Date() ? noShow(b) : '']))) : h('p', { class: 'muted' }, 'No bookings.'));
};

/* ---------- settings: rules, activities, suggestions, blocked words ---------- */
renderers.settings = async (main, sub) => {
  const tab = sub[0] || 'rules';
  const bar = tabs([['rules', 'Rules'], ['categories', 'Categories'], ['interests', 'Activities'], ['suggestions', 'Suggestions'], ['words', 'Blocked words']], tab, (v) => { location.hash = '#/settings/' + v; });
  const body = h('div');
  put(main, header('Settings'), bar, body);
  if (tab === 'rules') {
    const [rules, ints] = await Promise.all([rows(sb.from('rules').select('id,interest_id,key,value').order('key')), rows(sb.from('interests').select('id,name'))]);
    const nm = Object.fromEntries(ints.map((i) => [i.id, i.name]));
    body.append(h('p', { class: 'muted' }, 'Numbers that run the app. A row with an activity beside it overrides the default for that activity. Changes apply immediately.'),
      table(['Rule', 'Applies to', 'Value', ''], rules.map((r) => tr([h('code', null, r.key), r.interest_id ? nm[r.interest_id] || '#' + r.interest_id : 'Everything', JSON.stringify(r.value),
        h('button', { class: 'small', on: { click: async () => {
          const v = await promptBox('Edit ' + r.key, 'New value', { value: String(r.value), required: true }); if (v == null) return;
          const n = Number(v); if (!Number.isFinite(n)) { toast('Enter a number.', true); return; }
          if (await act(async () => { const { error } = await sb.from('rules').update({ value: n, updated_at: new Date().toISOString() }).eq('id', r.id); if (error) throw error; }, 'Saved')) refresh();
        } } }, 'Edit')]))));
  } else if (tab === 'categories') {
    const cats = await rpc('admin_categories');
    const KEYS = [['booking.max_people', 'Most people'], ['booking.window_min_hours', 'Post at least (hours ahead)'], ['booking.window_max_hours', 'Post at most (hours ahead)'], ['booking.close_hours', 'Joining closes (hours before)'], ['booking.max_duration_minutes', 'Longest (minutes)']];
    const edit = (c, k, label) => async () => {
      const v = await promptBox(c.name + ': ' + label, 'New number', { value: String((c.rules || {})[k] ?? ''), required: true }); if (v == null) return;
      const n = Number(v); if (!Number.isFinite(n) || n < 0) { toast('Enter a number.', true); return; }
      if (await act(() => rpc('admin_set_category', { p_group: c.id, p_bookings: null, p_key: k, p_value: n }), 'Saved')) refresh();
    };
    body.append(h('p', { class: 'muted' }, 'Each category sets how bookings work for its activities. An activity can have its own number in Rules, which beats the category. Categories without bookings can only have channels.'),
      table(['Category', 'Activities', 'Bookings'].concat(KEYS.map((k) => k[1])), cats.map((c) => tr([c.name, c.activities,
        h('button', { class: 'small', on: { click: async () => { if (await act(() => rpc('admin_set_category', { p_group: c.id, p_bookings: !c.bookings_allowed, p_key: null, p_value: null }), 'Saved')) refresh(); } } }, c.bookings_allowed ? 'On: switch off' : 'Off: switch on'),
      ].concat(KEYS.map(([k, label]) => h('button', { class: 'small', disabled: !c.bookings_allowed, on: { click: edit(c, k, label) } }, (c.rules || {})[k] ?? '–'))))))); 
  } else if (tab === 'interests') {
    const ints = await rows(sb.from('interests').select('id,name,group_id,is_active').order('name'));
    const groups = await rows(sb.from('interest_groups').select('id,name').order('sort'));
    const gn = Object.fromEntries(groups.map((g) => [g.id, g.name]));
    const name = h('input', { placeholder: 'New activity name', 'aria-label': 'New activity name', maxlength: '40' }), grp = h('select', { 'aria-label': 'Group' }, groups.map((g) => h('option', { value: g.id }, g.name)));
    body.append(h('div', { class: 'row', style: 'margin-bottom:14px' }, name, grp, h('button', { class: 'primary', on: { click: async () => {
      const n = name.value.trim(); if (!n) return;
      const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (await act(async () => { const { error } = await sb.from('interests').insert({ name: n, slug, group_id: Number(grp.value) }); if (error) throw new Error(error.code === '23505' ? 'interest_exists' : error.message); }, 'Added')) refresh();
    } } }, 'Add')),
    table(['Activity', 'Group', 'Shown in app', ''], ints.map((i) => tr([i.name, gn[i.group_id], i.is_active ? 'Yes' : 'Hidden', h('button', { class: 'small', on: { click: async () => { if (await act(async () => { const { error } = await sb.from('interests').update({ is_active: !i.is_active }).eq('id', i.id); if (error) throw error; }, 'Updated')) refresh(); } } }, i.is_active ? 'Hide' : 'Show')]))));
  } else if (tab === 'suggestions') {
    const [sug, groups] = await Promise.all([rows(sb.from('admin_interest_suggestions').select('*').eq('status', 'pending').order('created_at')), rows(sb.from('interest_groups').select('id,name').order('sort'))]);
    body.append(sug.length ? table(['Suggestion', 'From', 'When', ''], sug.map((s) => tr([s.text, '@' + s.username, fmtDate(s.created_at), h('div', { class: 'row' },
      h('button', { class: 'small primary', on: { click: async () => {
        const g = groups[0]; const nameV = await promptBox('Add “' + s.text + '” as an activity', 'Name as members will see it', { value: s.text, required: true, ok: 'Add' }); if (nameV == null) return;
        if (await act(() => rpc('approve_interest_suggestion', { p_id: s.id, p_group_id: g.id, p_name: nameV }), 'Added to the first group; move it from Activities if needed')) refresh();
      } } }, 'Approve'),
      h('button', { class: 'small', on: { click: async () => { if (await act(() => rpc('reject_interest_suggestion', { p_id: s.id }), 'Rejected')) refresh(); } } }, 'Reject'))]))) : h('p', { class: 'muted' }, 'No pending suggestions.'));
  } else {
    const words = await rows(sb.from('blocked_words').select('id,word').order('word'));
    const w = h('input', { placeholder: 'Add a word', 'aria-label': 'Word to block', maxlength: '40' });
    body.append(h('p', { class: 'muted' }, 'Messages containing these words are rejected.'), h('div', { class: 'row', style: 'margin-bottom:14px' }, w, h('button', { class: 'primary', on: { click: async () => {
      const v = w.value.trim().toLowerCase(); if (!v) return;
      if (await act(async () => { const { error } = await sb.from('blocked_words').insert({ word: v }); if (error) throw error; }, 'Added')) refresh();
    } } }, 'Add')), h('div', { class: 'checks' }, words.map((x) => h('span', { class: 'badge' }, x.word + ' ', h('button', { class: 'small', 'aria-label': 'Remove ' + x.word, on: { click: async () => { if (await act(async () => { const { error } = await sb.from('blocked_words').delete().eq('id', x.id); if (error) throw error; }, 'Removed')) refresh(); } } }, '×')))));
  }
};

/* ---------- activity log ---------- */
renderers.log = async (main) => {
  const [mods, jobs] = await Promise.all([
    rows(sb.from('moderation_actions').select('*').order('created_at', { ascending: false }).limit(100)),
    rows(sb.from('scheduler_log').select('*').order('ran_at', { ascending: false }).limit(30)).catch(() => []),
  ]);
  put(main, header('Activity log'), h('h3', null, 'Moderation actions'),
    mods.length ? table(['When', 'Action', 'Member', 'Reason', 'By', 'Until'], mods.map((m) => tr([fmtDate(m.created_at), badge(m.action), m.member_id.slice(0, 8), m.reason, m.by_admin ? 'admin' : 'system', m.ends_at ? fmtDate(m.ends_at) : ''])))  : h('p', { class: 'muted' }, 'Nothing yet.'),
    jobs.length ? [h('h3', null, 'Background jobs'), table(Object.keys(jobs[0]), jobs.map((j) => tr(Object.values(j).map((v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))))))] : null);
};

/* ---------- start ---------- */
(async () => {
  try {
    const { data } = await Promise.race([sb.auth.getSession(), new Promise((_, no) => setTimeout(() => no(new Error('Could not reach the server')), 10000))]);
    if (data.session) await gate(); else loginScreen();
  } catch (e) {
    try { localStorage.removeItem('sc-admin-session'); } catch {}
    loginScreen('Please sign in again. (' + (e.message || 'session problem') + ')');
  }
})();
