import assert from 'assert';
import {
  domainToRegex,
  matchesDomain,
  extractGroupNameFromTitle,
  isValidRegex,
  isValidDomain
} from '../js/modules/utils.js';

test('domainToRegex with typical domain', () => {
  const regex = domainToRegex('example.com');
  assert.ok(regex instanceof RegExp);
  assert.ok(regex.test('https://example.com'));
  assert.ok(!regex.test('https://sub.example.com'));
});

test('domainToRegex with wildcard domain', () => {
  const regex = domainToRegex('*.example.com');
  assert.ok(regex instanceof RegExp);
  assert.ok(regex.test('https://sub.example.com'));
  assert.ok(regex.test('https://example.com'));
});

test('matchesDomain typical', () => {
  assert.strictEqual(matchesDomain('https://example.com/page', 'example.com'), true);
  assert.strictEqual(matchesDomain('https://other.com', 'example.com'), false);
});

test('matchesDomain wildcard', () => {
  assert.strictEqual(matchesDomain('https://a.example.com', '*.example.com'), true);
  assert.strictEqual(matchesDomain('https://example.com', '*.example.com'), true);
});

test('extractGroupNameFromTitle valid regex', () => {
  const title = 'Issue #1234: Fix bug';
  const result = extractGroupNameFromTitle(title, 'Issue #(\\d+)');
  assert.strictEqual(result, '1234');
});

test('extractGroupNameFromTitle invalid regex', () => {
  const result = extractGroupNameFromTitle('Test', '(');
  assert.strictEqual(result, null);
});

test('isValidRegex edge cases', () => {
  assert.strictEqual(isValidRegex('Issue #(\\d+)'), true);
  assert.strictEqual(isValidRegex('Issue #\\d+'), false); // no capturing group
  assert.strictEqual(isValidRegex('('), false); // invalid syntax
});

test('isValidDomain edge cases', () => {
  assert.strictEqual(isValidDomain('example.com'), true);
  assert.strictEqual(isValidDomain('*.example.com'), true);
  assert.strictEqual(isValidDomain('example'), false);
  assert.strictEqual(isValidDomain(''), false);
});
