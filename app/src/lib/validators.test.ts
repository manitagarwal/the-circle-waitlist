import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from './validators.ts';
import { friendly, usernameStatusText } from './messages.ts';

test('phone', () => {
  assert.equal(v.normalizePhone('+91 98765 43210'), '9876543210');
  assert.equal(v.normalizePhone('09876543210'), '9876543210');
  assert.equal(v.normalizePhone('5876543210'), null);
  assert.equal(v.normalizePhone('98765'), null);
});
test('email', () => {
  assert.ok(v.isPersonalEmail('A@Gmail.com'));
  assert.ok(!v.isPersonalEmail('a@acme.com'));
  assert.ok(!v.isEmail('nope'));
});
test('username', () => {
  assert.equal(v.usernameProblem('anna.k_92'), null);
  assert.ok(v.usernameProblem('ab'));
  assert.ok(v.usernameProblem('.abc'));
  assert.ok(v.usernameProblem('a..bc'));
  assert.equal(v.cleanUsername('Anna K!'), 'annak');
});
test('application code', () => {
  assert.equal(v.applicationCode('3f07-db5c'), '3F07DB5C');
  assert.ok(!v.isApplicationCode('3F07'));
});
test('messages', () => {
  assert.match(friendly({ message: 'not_accepted' }), /hasn't been accepted/);
  assert.equal(usernameStatusText('ok'), null);
  assert.match(usernameStatusText('taken')!, /taken/);
});
test('linkedin', () => {
  assert.equal(v.linkedInHandle('https://linkedin.com/in/annak/?x=1'), 'annak');
});
test('unknown errors keep their reason', () => {
  assert.match(friendly({ message: 'boom' }), /\(boom\)/);
  assert.match(friendly({ message: 'email rate limit exceeded' }), /Wait a few minutes/);
});
test('resend wait message', () => {
  assert.match(friendly({ message: 'For security purposes, you can only request this after 42 seconds.' }), /wait 42 seconds/);
});
