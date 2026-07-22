// Build step for Lift. Bundles + minifies the editable src/ modules and the
// stylesheet into dist/, then regenerates service-worker.js (its cache list
// and version) from service-worker.template.js so it never has to be hand-
// maintained. Run with `npm run build`. The dist/ output and the generated
// service-worker.js are committed so GitHub Pages serves them directly.
//
// Source of truth = src/*.js, styles.css, index.html, service-worker.template.js.
// Generated (do not hand-edit) = dist/app.js, dist/app.css, service-worker.js.

import esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const OUT_DIR = 'dist';

// Assets the service worker precaches for offline use. The two dist/ files are
// the whole app now; the rest are static.
const PRECACHE = [
  './',
  './index.html',
  './dist/app.js',
  './dist/app.css',
  './manifest.webmanifest',
  './icons/icon.svg',
];

// Files whose bytes should influence the cache version, so any content change
// forces the service worker to update. (index.html carries the script/style
// refs; the two dist/ files are the built app; manifest + icon round it out.)
const HASH_INPUTS = ['dist/app.js', 'dist/app.css', 'index.html', 'manifest.webmanifest', 'icons/icon.svg'];

async function build() {
  await mkdir(OUT_DIR, { recursive: true });

  // Bundle every src/ module reachable from main.js into one minified file.
  // target safari14 keeps it safe for older iPhones.
  await esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['safari14'],
    outfile: `${OUT_DIR}/app.js`,
    legalComments: 'none',
  });

  // Minify the stylesheet (no imports to resolve; the search-icon data URI is
  // inline, so nothing external is pulled in).
  await esbuild.build({
    entryPoints: ['styles.css'],
    bundle: true,
    minify: true,
    target: ['safari14'],
    outfile: `${OUT_DIR}/app.css`,
    legalComments: 'none',
  });

  // Content hash → cache version, so the service worker updates iff the app
  // content actually changed.
  const hash = createHash('sha256');
  for (const f of HASH_INPUTS) hash.update(await readFile(f));
  const version = `lift-${hash.digest('hex').slice(0, 12)}`;

  // Regenerate service-worker.js from the template (#3: never hand-maintain
  // the cache list or version again).
  const template = await readFile('service-worker.template.js', 'utf8');
  const sw = template
    .replace('%CACHE_VERSION%', version)
    .replace('%ASSETS%', JSON.stringify(PRECACHE, null, 2));
  await writeFile('service-worker.js', sw);

  const [js, css] = await Promise.all([
    readFile(`${OUT_DIR}/app.js`), readFile(`${OUT_DIR}/app.css`),
  ]);
  console.log(`Built ${OUT_DIR}/app.js (${(js.length / 1024).toFixed(1)} KB) + ${OUT_DIR}/app.css (${(css.length / 1024).toFixed(1)} KB)`);
  console.log(`Regenerated service-worker.js @ ${version}`);
}

build().catch((err) => { console.error(err); process.exit(1); });
