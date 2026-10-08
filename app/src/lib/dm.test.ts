import test from 'node:test';
import assert from 'node:assert/strict';
import { composerState } from './dm.ts';

test('composer states', () => {
  assert.equal(composerState(null, 0), 'first');
  assert.equal(composerState({ status: 'accepted', requested_by_me: false }, 5), 'open');
  assert.equal(composerState({ status: 'pending', requested_by_me: true }, 0), 'first');
  assert.equal(composerState({ status: 'pending', requested_by_me: true }, 1), 'waiting');
  assert.equal(composerState({ status: 'pending', requested_by_me: false }, 0), 'accept');
  assert.equal(composerState({ status: 'declined', requested_by_me: true }, 1), 'declined');
  assert.equal(composerState({ status: 'declined', requested_by_me: false }, 0), 'first');
});
