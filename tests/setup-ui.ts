import '@testing-library/jest-dom/vitest';

// Radix primitives (Presence, FocusScope, DismissableLayer) drive their
// open/close transitions from `animationend` / `transitionend` events.
// In happy-dom those events don't fire the same way as in a browser, so the
// internal state updates land outside React's act() tracking and produce
// "An update to Presence inside a test was not wrapped in act(...)" noise.
// These are environment artifacts, not test bugs. Filter only those exact
// Radix internals so genuine act() warnings from our own components still
// surface.
const RADIX_TRANSITION_INTERNALS = new Set([
  'Presence',
  'FocusScope',
  'DismissableLayer',
]);

// React formats the warning as
// `console.error("An update to %s inside a test was not wrapped in act...", name)`
// so the component name is in args[1], not interpolated into args[0].
const ACT_WARNING_PREFIX = 'An update to %s inside a test was not wrapped in act';
const ACT_WARNING_LITERAL_PATTERN =
  /^An update to (\w+) inside a test was not wrapped in act/;

const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string') {
    if (
      first.startsWith(ACT_WARNING_PREFIX) &&
      typeof args[1] === 'string' &&
      RADIX_TRANSITION_INTERNALS.has(args[1])
    ) {
      return;
    }
    const literalMatch = first.match(ACT_WARNING_LITERAL_PATTERN);
    if (literalMatch && RADIX_TRANSITION_INTERNALS.has(literalMatch[1])) {
      return;
    }
  }
  originalConsoleError(...args);
};
