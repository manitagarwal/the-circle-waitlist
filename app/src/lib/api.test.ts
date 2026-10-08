import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from './api.ts';

function fake(handlers: Record<string, any>) {
  const calls: any[] = [];
  const sb: any = {
    rpc: async (fn: string, args: any) => { calls.push([fn, args]); return handlers[fn] ?? { data: null, error: null }; },
    from: (t: string) => ({ insert: async (row: any) => { calls.push([t, row]); return handlers[`insert:${t}`] ?? { error: null }; } }),
    auth: {},
  };
  return { sb, calls };
}

test('duplicates normalises inputs', async () => {
  const { sb, calls } = fake({ check_applicant_duplicates: { data: { phone: true }, error: null } });
  const r = await createApi(sb).checkDuplicates({ phone: '+91 98765 43210', workEmail: ' A@Acme.com ' });
  assert.deepEqual(r, { phone: true });
  assert.deepEqual(calls[0][1], { p_phone: '9876543210', p_personal_email: null, p_work_email: 'a@acme.com' });
});
test('submit resolves referral and inserts vouches', async () => {
  const { sb, calls } = fake({ resolve_referral_code: { data: 'uuid-1', error: null } });
  await createApi(sb).submitApplication(
    { id: 'x', fullName: ' A ', phone: '9876543210', personalEmail: 'a@gmail.com', workEmail: 'A@acme.com', linkedin: 'https://linkedin.com/in/a', city: 'Delhi', referredByCode: '3f07db5c' },
    [{ name: 'R' }],
  );
  assert.equal(calls[1][1].referred_by_id, 'uuid-1');
  assert.equal(calls[1][1].work_email, 'a@acme.com');
  assert.equal(calls[2][0], 'referrals');
});
test('errors throw', async () => {
  const { sb } = fake({ username_available: { data: null, error: { message: 'not_signed_in' } } });
  await assert.rejects(createApi(sb).usernameAvailable('abc'));
});

test('my application returns the first row or null', async () => {
  const row = { id: 'a', full_name: 'A', status: 'pending', city: 'Delhi', created_at: '', queue_position: 1, referral_code: 'ABCD1234' };
  const a = createApi(fake({ my_application: { data: [row], error: null } }).sb);
  assert.equal((await a.myApplication())?.status, 'pending');
  const b = createApi(fake({ my_application: { data: [], error: null } }).sb);
  assert.equal(await b.myApplication(), null);
});
test('activate sends the username only', async () => {
  const { sb, calls } = fake({ activate_membership: { data: { member_id: 'm', username: 'a.b' }, error: null } });
  await createApi(sb).activate('a.b');
  assert.deepEqual(calls[0], ['activate_membership', { p_username: 'a.b' }]);
});

test('work email is proven on a separate client', async () => {
  const main = fake({});
  const calls: string[] = [];
  const work: any = { auth: {
    signInWithOtp: async () => { calls.push('otp'); return { error: null }; },
    verifyOtp: async () => { calls.push('verify'); return { error: null }; },
    signOut: async () => { calls.push('signout'); return { error: null }; },
  } };
  const a = createApi(main.sb, work);
  await a.sendWorkCode('A@Corp.com'); await a.verifyWorkCode('a@corp.com', '123456');
  assert.deepEqual(calls, ['otp', 'verify', 'signout']);
});

test('sign up needs a session back (email confirmation must be off)', async () => {
  const mk = (session: unknown) => ({ auth: { signUp: async (a: any) => ({ data: { session }, error: null, a }) } }) as any;
  await createApi(mk({ access_token: 'x' })).signUp('A@x.com', 'password1');
  await assert.rejects(createApi(mk(null)).signUp('a@x.com', 'password1'), /confirm_email_required/);
});
