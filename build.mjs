let build;
try {
  ({ build } = await import('esbuild'));
} catch (e) {
  console.error('esbuild is not installed. Run `npm install` before building.');
  process.exit(1);
}

import { rmSync, mkdirSync, cpSync } from 'fs';
import { join } from 'path';

const outdir = 'dist';
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const aliasPlugin = {
  name: 'preact-alias',
  setup(build) {
    const map = {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      'react/jsx-dev-runtime': 'preact/jsx-dev-runtime'
    };
    for (const key in map) {
      build.onResolve({ filter: new RegExp('^' + key + '$') }, () => ({ path: map[key] }));
    }
  }
};

const shared = {
  bundle: true,
  format: 'esm',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  loader: { '.ts': 'ts', '.tsx': 'tsx', '.jsx': 'jsx' },
  plugins: [aliasPlugin]
};

await Promise.all([
  build({ entryPoints: ['options/options.tsx'], outfile: join(outdir, 'options', 'options.js'), ...shared }),
  build({ entryPoints: ['popup/popup.tsx'], outfile: join(outdir, 'popup', 'popup.js'), ...shared }),
  build({ entryPoints: ['js/background.js'], outfile: join(outdir, 'js', 'background.js'), ...shared }),
  build({ entryPoints: ['js/content.js'], outfile: join(outdir, 'js', 'content.js'), ...shared })
]);

// Copy static assets
cpSync('manifest.json', join(outdir, 'manifest.json'));
cpSync('_locales', join(outdir, '_locales'), { recursive: true });
cpSync('icons', join(outdir, 'icons'), { recursive: true });
cpSync('css', join(outdir, 'css'), { recursive: true });
cpSync('components', join(outdir, 'components'), { recursive: true });
cpSync('data', join(outdir, 'data'), { recursive: true });
cpSync('options/options.html', join(outdir, 'options', 'options.html'));
cpSync('popup/popup.html', join(outdir, 'popup', 'popup.html'));
