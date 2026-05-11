/**
 * Absolute roots of every screenshot destination, declared once and shared
 * across every routing manifest.
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { DestinationTarget } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const DESTINATION_ROOTS: Record<DestinationTarget, string> = {
  starlight: path.join(PROJECT_ROOT, 'docs/src/assets/screenshots'),
  readme: path.join(PROJECT_ROOT, 'doc/readme'),
  'chrome-web-store': path.join(PROJECT_ROOT, 'doc/chrome-web-store'),
};
