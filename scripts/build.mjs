import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalogErrors,verifiedOptions} from '../shared/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')),errors=catalogErrors(catalog);
if(errors.length){console.error('Catalog validation failed:\n'+errors.join('\n'));process.exit(1);}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
// Allowlist only browser assets. No .env, server source, raw drafts, reference photos or API responses.
for(const name of ['index.html','assets','shared','admin'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
fs.mkdirSync(path.join(out,'docs'),{recursive:true});fs.copyFileSync(path.join(root,'docs/product-policy.html'),path.join(out,'docs/product-policy.html'));
console.log(`1R build: ${verifiedOptions(catalog).length} eligible options; public assets → dist/. API is deployed separately from api/commerce.mjs.`);
