import test from 'node:test';
import assert from 'node:assert/strict';
import { eventCta, eventFit, eventRules, priceText, spotsText } from './events.ts';
import type { EventRow } from './api.ts';

const now = new Date('2026-10-09T12:00:00Z');
const mk = (o: Partial<EventRow> = {}): EventRow => ({ id: 'e', title: 'T', description: null, interest_id: 1, interest_name: 'Chess', cover_path: null, venue_name: null, area: null, city: null, address_text: null,
  starts_at: '2026-10-11T13:00:00Z', ends_at: '2026-10-11T16:00:00Z', capacity: 30, price_inr: 0, age_min: null, age_max: null, genders: [], cities: [], min_score: null, status: 'published',
  going_count: 12, waitlist_count: 0, my_status: null, my_position: null, ...o });

test('wording', () => {
  assert.equal(priceText(0), 'Free');
  assert.equal(priceText(499), '₹499');
  assert.equal(priceText(499.5), '₹499.50');
  assert.equal(spotsText(mk()), '12 of 30 going');
  assert.equal(spotsText(mk({ going_count: 30, waitlist_count: 3 })), 'Full. 3 on the waitlist');
  assert.equal(spotsText(mk({ capacity: null })), '12 going');
  assert.deepEqual(eventRules(mk({ cities: ['Delhi', 'Noida'], age_min: 25, age_max: 35, genders: ['female'], min_score: 7 })), ['Members in Delhi, Noida', 'Ages 25 to 35', 'For women', 'Reliable members only']);
  assert.deepEqual(eventRules(mk()), []);
});
test('fit', () => {
  assert.equal(eventFit(mk({ cities: ['Delhi'] }), { age: 30, gender: 'male', city: 'Noida' }), 'For members in Delhi.');
  assert.equal(eventFit(mk({ genders: ['female'] }), { age: 30, gender: 'male', city: 'Delhi' }), 'For women.');
  assert.equal(eventFit(mk({ age_min: 25 }), { age: 20, gender: 'male', city: 'Delhi' }), 'For ages 25 and over.');
  assert.equal(eventFit(mk(), { age: 99, gender: 'male', city: 'Pune' }), null);
});
test('main button', () => {
  assert.equal(eventCta(mk(), now), 'reserve');
  assert.equal(eventCta(mk({ going_count: 30 }), now), 'waitlist');
  assert.equal(eventCta(mk({ price_inr: 499 }), now), 'paid');
  assert.equal(eventCta(mk({ my_status: 'going' }), now), 'cancel');
  assert.equal(eventCta(mk({ my_status: 'waitlist' }), now), 'cancel_waitlist');
  assert.equal(eventCta(mk({ status: 'cancelled' }), now), 'cancelled');
  assert.equal(eventCta(mk({ ends_at: '2026-10-09T10:00:00Z' }), now), 'over');
  assert.equal(eventCta(mk({ my_status: 'attended' }), now), 'none');
});
