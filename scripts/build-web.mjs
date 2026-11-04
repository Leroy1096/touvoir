import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(projectRoot, 'www');
const excludedHtml = new Set(['CONCEPTION-UI-UX.html']);
const rootFiles = ['robots.txt', 'sitemap.xml'];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const entries = await readdir(projectRoot, { withFileTypes: true });
const htmlPages = entries
  .filter((entry) => entry.isFile() && extname(entry.name) === '.html' && !excludedHtml.has(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const file of [...htmlPages, ...rootFiles]) {
  await cp(join(projectRoot, file), join(outputDir, file));
}

await cp(join(projectRoot, 'assets'), join(outputDir, 'assets'), {
  recursive: true,
  filter: (source) => !source.endsWith('.DS_Store'),
});

const missing = [];
for (const required of ['index.html', 'assets/css/style.css', 'assets/js/main.js', 'assets/js/native-bridge.js']) {
  try {
    await stat(join(outputDir, required));
  } catch {
    missing.push(required);
  }
}

if (missing.length) {
  throw new Error(`Build incomplet, fichiers manquants : ${missing.join(', ')}`);
}

console.log(`Build web TOUVOIR terminé : ${htmlPages.length} pages copiées dans www/.`);
