import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let failed = 0;

global.test = (name, fn) => {
  try {
    fn();
    console.log(`\u2713 ${name}`);
  } catch (err) {
    failed++;
    console.error(`\u2717 ${name}`);
    console.error(err);
  }
};

for (const file of fs.readdirSync(__dirname)) {
  if (file.endsWith('.test.js')) {
    await import(pathToFileURL(path.join(__dirname, file)).href);
  }
}

if (failed > 0) {
  console.error(`${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('All tests passed.');
}
