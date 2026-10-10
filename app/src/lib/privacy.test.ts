import test from 'node:test';
import assert from 'node:assert/strict';
import { aboutLine, isShown, PRIVACY_FIELDS } from './privacy.ts';

test('everything is shown by default and a switch hides one thing', () => {
  assert.equal(isShown(null, 'hide_age'), true);
  assert.equal(isShown({}, 'hide_area'), true);
  assert.equal(isShown({ hide_area: true }, 'hide_area'), false);
  assert.equal(isShown({ hide_area: true }, 'hide_age'), true);
});
test('seven things can be hidden, with distinct keys', () => {
  assert.equal(PRIVACY_FIELDS.length, 7);
  assert.equal(new Set(PRIVACY_FIELDS.map((f) => f.key)).size, 7);
});
test('the about line only has what is shown', () => {
  assert.equal(aboutLine({ age: 27, area: 'Vasant Kunj', field_of_work: 'Design' }), '27 · Vasant Kunj · Design');
  assert.equal(aboutLine({ age: null, area: null, field_of_work: 'Design' }), 'Design');
  assert.equal(aboutLine({}), '');
});
