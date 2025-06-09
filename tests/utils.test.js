import assert from 'assert';
import {
  domainToRegex,
  matchesDomain,
  extractGroupNameFromTitle,
  extractGroupNameFromUrl,
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

test('extractGroupNameFromUrl valid path regex', () => {
  const url = 'https://github.com/user/repo/issues/123';
  const result = extractGroupNameFromUrl(url, 'issues/(\\d+)');
  assert.strictEqual(result, '123');
});

test('extractGroupNameFromUrl valid query regex', () => {
  const url = 'https://example.com/page?ticket=456';
  const result = extractGroupNameFromUrl(url, 'ticket=(\\d+)');
  assert.strictEqual(result, '456');
});

test('extractGroupNameFromUrl no match', () => {
  const url = 'https://example.com/home';
  const result = extractGroupNameFromUrl(url, 'issues/(\\d+)');
  assert.strictEqual(result, null);
});

test('extractGroupNameFromUrl invalid regex', () => {
  const url = 'https://example.com';
  const result = extractGroupNameFromUrl(url, '(');
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
