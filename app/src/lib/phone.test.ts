import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DIAL, formatPhone, maxLength, phoneError, readInput, validatePhone } from './phone.ts';

test('India is the default and takes exactly ten digits', () => {
  assert.equal(DEFAULT_DIAL, '91');
  assert.equal(validatePhone('91', '9876543210'), '+919876543210');
  assert.equal(validatePhone('91', '98765 43210'), '+919876543210');
  assert.equal(validatePhone('91', '5876543210'), null); // must start 6 to 9
  assert.equal(validatePhone('91', '98765432101'), null); // eleven digits is not allowed
  assert.equal(validatePhone('91', '987654321'), null);
});
test('typing is capped at the longest valid length', () => {
  assert.equal(readInput('91', '98765432101234').national, '9876543210');
  assert.equal(maxLength('91'), 10);
  assert.equal(maxLength('49'), 11);
});
test('pasting a number with a country code moves the code out', () => {
  assert.deepEqual({ ...readInput('91', '+91 98765 43210') }, { dial: '91', national: '9876543210', resolved: true });
  assert.deepEqual({ ...readInput('91', '919876543210') }, { dial: '91', national: '9876543210', resolved: true });
  assert.deepEqual({ ...readInput('91', '+971 50 123 4567') }, { dial: '971', national: '501234567', resolved: true });
  assert.deepEqual({ ...readInput('91', '+44 7911 123456') }, { dial: '44', national: '7911123456', resolved: true });
  assert.deepEqual({ ...readInput('91', '0044 7911 123456') }, { dial: '44', national: '7911123456', resolved: true });
});
test('typing a code character by character keeps the text until it resolves', () => {
  assert.equal(readInput('91', '+').resolved, false);
  assert.equal(readInput('91', '+9').resolved, false);
  assert.equal(readInput('91', '+97').resolved, false);
  assert.deepEqual({ ...readInput('91', '+971') }, { dial: '971', national: '', resolved: true });
  assert.equal(readInput('91', '98765').resolved, true);
});
test('other countries', () => {
  assert.equal(validatePhone('971', '501234567'), '+971501234567');
  assert.equal(validatePhone('971', '0501234567'), '+971501234567'); // local leading zero dropped
  assert.equal(validatePhone('971', '50123'), null);
  assert.equal(validatePhone('1', '4155550123'), '+14155550123');
  assert.equal(validatePhone('999', '123456789'), null); // unknown code
});
test('messages and display', () => {
  assert.equal(phoneError('91', '123'), 'Enter a 10-digit Indian mobile number.');
  assert.match(phoneError('971', '12') ?? '', /9-digit mobile number for United Arab Emirates/);
  assert.equal(phoneError('91', '9876543210'), null);
  assert.equal(formatPhone('+919876543210'), '+91 98765 43210');
  assert.equal(formatPhone('9876543210'), '+91 98765 43210'); // old records
  assert.equal(formatPhone('+971501234567'), '+971 501234567');
});
