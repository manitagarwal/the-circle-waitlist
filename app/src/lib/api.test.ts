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
