/**
 * Project logger — mirrors WXT's internal logger pattern.
 * debug/log are no-ops in production; warn/error always pass through.
 */
const PREFIX = '[smart-tab-organizer]';
const isDev = import.meta.env.MODE !== 'production';

export const logger = {
  debug: (...args: unknown[]) => isDev && console.debug(PREFIX, ...args),
  log: (...args: unknown[]) => isDev && console.log(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
};
