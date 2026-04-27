/**
 * Vitest setup for portable stories (composeStories).
 *
 * 1. Loads EN locale messages from the JSON file on disk.
 * 2. Re-attaches a working `browser.i18n.getMessage` on `fakeBrowser`
 *    after each `fakeBrowser.reset()` (which runs in setup.ts beforeEach).
 * 3. Calls `setProjectAnnotations` with a minimal Theme decorator
 *    (synchronous, no fetch, unlike the Storybook preview which loads
 *    translations asynchronously).
 */
import { beforeEach } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as reactAnnotations from '@storybook/react/preview';
import { fakeBrowser } from 'wxt/testing';
import React from 'react';
import { Theme } from '@radix-ui/themes';
import fs from 'fs';
import path from 'path';

// ── Load EN messages once ──────────────────────────────────────────────
type LocaleMessage = {
  message: string;
  placeholders?: Record<string, { content: string }>;
};
const messagesPath = path.resolve(__dirname, '../public/_locales/en/messages.json');
const messages: Record<string, LocaleMessage> = JSON.parse(
  fs.readFileSync(messagesPath, 'utf8'),
);

function resolveMessage(entry: LocaleMessage, substitutions?: string | string[]): string {
  let msg = entry.message;
  if (entry.placeholders) {
    for (const [name, p] of Object.entries(entry.placeholders)) {
      msg = msg.split(`$${name}$`).join(p.content);
    }
  }
  if (substitutions !== undefined) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    msg = msg.replace(/\$(\d+)/g, (m, n) => subs[Number(n) - 1] ?? m);
  }
  return msg;
}

// ── Provide a working i18n.getMessage on fakeBrowser ───────────────────
// Must run AFTER the global beforeEach in setup.ts that calls
// fakeBrowser.reset(). Setup files are processed in order, so hooks
// registered here run after those from setup.ts.
beforeEach(() => {
  (fakeBrowser as any).i18n = {
    getMessage: (key: string, substitutions?: string | string[]) => {
      const entry = messages[key];
      if (!entry) return key;
      return resolveMessage(entry, substitutions);
    },
  };
});

// ── Project annotations (decorators applied by composeStories) ─────────
// reactAnnotations provides the React render function required by Storybook 9.
// The custom decorator wraps stories in <Theme> (same as .storybook/preview.tsx
// but without the async locale fetch).
setProjectAnnotations([
  reactAnnotations,
  {
    decorators: [
      (Story: React.ComponentType) => (
        React.createElement(Theme, null,
          React.createElement('div', { style: { padding: '20px', maxWidth: '400px' } },
            React.createElement(Story),
          ),
        )
      ),
    ],
  },
]);
