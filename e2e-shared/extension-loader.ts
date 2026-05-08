/**
 * Shared persistent-context launcher for the WXT-built Chrome extension.
 *
 * Centralises userDataDir creation, Chromium executable resolution, deterministic
 * font/GPU flags (so screenshot pipelines produce stable PNGs), and service-worker
 * readiness. Used by tests/e2e, e2e-screenshots, e2e-doc-scenarios.
 */
import { chromium, type BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { findChromium } from './chromium-finder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the built Chrome MV3 extension. */
export const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');

export interface LaunchExtensionOptions {
  /** Identifier suffix for the temporary userDataDir (e.g. project name). */
  label?: string;
  /** Force headless. Defaults to `process.platform === 'linux'`. */
  headless?: boolean;
  /** Chrome `--lang=` flag. Defaults to `en-US`. */
  lang?: string;
  /** Apply deterministic font/GPU flags for screenshot stability. Default `false`. */
  deterministicRendering?: boolean;
  /** Set browser viewport. */
  viewport?: { width: number; height: number };
  /** Extra Chromium args appended after the standard set. */
  extraArgs?: string[];
  /** Value for `--host-resolver-rules`. Useful to map fictional domains to a local server. */
  hostResolverRules?: string;
  /** Service-worker registration timeout (ms). Default 10_000. */
  serviceWorkerTimeoutMs?: number;
}

export interface LaunchedExtension {
  context: BrowserContext;
  userDataDir: string;
}

/**
 * Launch a persistent Chromium context with the extension loaded.
 *
 * Caller is responsible for closing the context and removing `userDataDir`
 * (use {@link cleanupUserDataDir}).
 */
export async function launchExtension(
  options: LaunchExtensionOptions = {},
): Promise<LaunchedExtension> {
  if (!fs.existsSync(path.join(EXTENSION_PATH, 'manifest.json'))) {
    throw new Error(
      `Extension not built at ${EXTENSION_PATH}. Run "pnpm build" first.`,
    );
  }

  const label = options.label ?? 'extension';
  const userDataDir = path.join(os.tmpdir(), `playwright-${label}-${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });

  const headless = options.headless ?? process.platform === 'linux';
  const lang = options.lang ?? 'en-US';

  const baseArgs = [
    `--disable-extensions-except=${EXTENSION_PATH}`,
    `--load-extension=${EXTENSION_PATH}`,
    `--lang=${lang}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-popup-blocking',
  ];

  if (options.deterministicRendering) {
    baseArgs.push(
      '--force-device-scale-factor=1',
      '--font-render-hinting=none',
      '--disable-font-subpixel-positioning',
      '--disable-lcd-text',
      '--disable-gpu',
    );
  }

  if (options.hostResolverRules) {
    baseArgs.push(`--host-resolver-rules=${options.hostResolverRules}`);
  }

  if (headless) {
    baseArgs.push('--no-sandbox', '--disable-dev-shm-usage');
  }

  if (options.extraArgs) {
    baseArgs.push(...options.extraArgs);
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    executablePath: findChromium(),
    args: baseArgs,
    viewport: options.viewport,
  });

  const swDeadline = Date.now() + (options.serviceWorkerTimeoutMs ?? 10_000);
  while (!context.serviceWorkers()[0] && Date.now() < swDeadline) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!context.serviceWorkers()[0]) {
    await context.close();
    throw new Error('Extension service worker did not start within timeout');
  }

  return { context, userDataDir };
}

/** Best-effort cleanup of a temporary userDataDir. */
export function cleanupUserDataDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}
