import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const hosting = JSON.parse(await fs.readFile(path.join(root, '.openai/hosting.json'), 'utf8'));
if (!hosting.project_id || hosting.static) throw Error('Sites Worker requires a project_id and no static configuration');
// scripts/build.mjs creates only the existing, explicit public allowlist.
// Embed that exact output so no filesystem or static-asset binding is required.
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const assets = {};
async function collect(directory, prefix = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.name.startsWith('.') || ['server', 'client'].includes(entry.name)) throw Error('Run a clean web build before the Sites build');
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative + '/');
    else {
      const type = types[path.extname(entry.name)];
      if (!entry.isFile() || !type) throw Error('Unsupported public asset: ' + relative);
      assets['/' + relative] = { type, body: await fs.readFile(path.join(directory, entry.name), 'utf8') };
    }
  }
}
await collect(out);
await build({
  entryPoints: [path.join(root, 'server/sites-worker.mjs')],
  outfile: path.join(out, 'server/index.js'),
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022',
  external: ['node:crypto'],
  plugins: [{ name: 'public-allowlist', setup(plugin) {
    plugin.onResolve({ filter: /^one-r:public-assets$/ }, () => ({ path: 'assets', namespace: 'one-r' }));
    plugin.onLoad({ filter: /.*/, namespace: 'one-r' }, () => ({ contents: 'export default ' + JSON.stringify(assets), loader: 'js' }));
  } }],
});
// The deployment contains a single Worker and metadata, never source folders,
// room photos, test fixtures, operator drafts, .env files, or source maps.
for (const entry of await fs.readdir(out)) if (entry !== 'server') await fs.rm(path.join(out, entry), { recursive: true, force: true });
await fs.writeFile(path.join(out, 'server/wrangler.json'), JSON.stringify({
  name: 'one-r-studio', main: 'index.js', compatibility_date: '2026-08-01', compatibility_flags: ['nodejs_compat'],
}, null, 2) + '\n');
await fs.mkdir(path.join(out, '.openai'), { recursive: true });
await fs.writeFile(path.join(out, '.openai/hosting.json'), JSON.stringify(hosting, null, 2) + '\n');
console.log(`Sites Worker: ${Object.keys(assets).length} unchanged public assets embedded; runtime-only commerce secrets.`);
