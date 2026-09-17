import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'index.html');
const outDir = path.join(root, 'dist');

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(source, path.join(outDir, 'index.html'));
console.log(`Built dist/index.html from root index.html (${Math.round(fs.statSync(source).size / 1024)} KB).`);
