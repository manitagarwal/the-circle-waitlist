import test from 'node:test';
import assert from 'node:assert/strict';
import { describe } from './activity.ts';

const n = (type: string, payload: any) => ({ id: '1', type, payload, read_at: null, is_unread: true, created_at: '' });
test('friend request shows actions, a message does not', () => {
  const f = describe(n('friend_request', { from_id: 'u', from_username: 'priya.n', message: 'Hi' }));
  assert.equal(f.title, 'priya.n wants to be friends.');
  assert.equal(f.actions, 'friend');
  assert.equal(f.body, 'Hi');
  const m = describe(n('friend_request', { from_username: 'rohan.m', via: 'dm' }));
  assert.equal(m.actions, undefined);
  assert.equal(m.go?.to, 'messages');
});
test('bookings, invites, broadcasts', () => {
  assert.equal(describe(n('booking_join', { member_username: 'karan.v', title: 'Badminton', booking_id: 'b' })).go?.id, 'b');
  assert.match(describe(n('channel_invite', { channel_name: 'Poker' })).title, /Poker/);
  assert.equal(describe(n('broadcast', { title: 'Hello', body: 'World' })).from, 'The Semi Circle');
  assert.match(describe(n('moderation_notice', { action: 'suspension_ended' })).title, /ended/);
  assert.equal(describe(n('unknown', {})).title, 'Something happened.');
});

test('being added to a group opens the Groups tab', () => {
  const v = describe(n('group_added', { by_username: 'aditi.s', channel_name: 'Weekend crew' }));
  assert.equal(v.title, 'aditi.s added you to Weekend crew.');
  assert.equal(v.go?.tab, 'groups');
});

test('an announcement can carry a picture, and a friend request opens the sender', () => {
  assert.equal(describe(n('broadcast', { title: 'Hi', body: 'x', image_path: 'a/b.jpg' })).image, 'a/b.jpg');
  assert.equal(describe(n('broadcast', { title: 'Hi' })).image, null);
  const f = describe(n('friend_request', { from_username: 'aditi.s', from_id: 'u1' }));
  assert.deepEqual(f.go, { to: 'member', id: 'u1' });
  assert.equal(f.actions, 'friend');
});

test('a public channel invite names the inviter and opens the channel', () => {
  const v = describe(n('channel_invite', { channel_name: 'Poker', channel_id: 'c1', inviter_username: 'asha' }));
  assert.match(v.title, /asha invited you to Poker/);
  assert.deepEqual(v.go, { to: 'channel', id: 'c1' });
});
