import test from 'node:test';
import assert from 'node:assert/strict';
import { computeGate } from './gate.ts';

const base = { ready: true, signedIn: true, member: null, applicationStatus: null as string | null, hasPassword: true };
test('gates', () => {
  assert.equal(computeGate({ ...base, ready: false }), 'loading');
  assert.equal(computeGate({ ...base, signedIn: false }), 'public');
  assert.equal(computeGate(base), 'apply');
  assert.equal(computeGate({ ...base, hasPassword: false }), 'apply'); // password is set inside the apply flow
  assert.equal(computeGate({ ...base, applicationStatus: 'pending' }), 'review');
  assert.equal(computeGate({ ...base, applicationStatus: 'shortlisted' }), 'review');
  assert.equal(computeGate({ ...base, applicationStatus: 'rejected' }), 'review');
  assert.equal(computeGate({ ...base, applicationStatus: 'accepted' }), 'accepted');
  assert.equal(computeGate({ ...base, member: { onboarded_at: null } }), 'setup');
  assert.equal(computeGate({ ...base, member: { onboarded_at: 'x' } }), 'app');
});
test('no password means stopped at password', () => {
  const np = { ...base, hasPassword: false };
  assert.equal(computeGate({ ...np, applicationStatus: 'pending' }), 'password');
  assert.equal(computeGate({ ...np, applicationStatus: 'accepted' }), 'password');
  assert.equal(computeGate({ ...np, member: { onboarded_at: 'x' } }), 'password');
  assert.equal(computeGate({ ...np, member: { onboarded_at: null } }), 'password');
});

test('closed and banned accounts', () => {
  assert.equal(computeGate({ ...base, member: { onboarded_at: 'x', state: 'deleted' } }), 'closed');
  assert.equal(computeGate({ ...base, member: { onboarded_at: 'x', state: 'banned' } }), 'banned');
  assert.equal(computeGate({ ...base, hasPassword: false, member: { onboarded_at: 'x', state: 'deleted' } }), 'closed');
  assert.equal(computeGate({ ...base, member: { onboarded_at: 'x', state: 'suspended' } }), 'app');
});
