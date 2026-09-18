import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {catalogErrors,verifiedOptions} from '../shared/catalog.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8')),errors=catalogErrors(catalog);
if(errors.length){console.error('Catalog validation failed:\n'+errors.join('\n'));process.exit(1);}
const assets=['studio.js','studio.css','plan.js','mesh.js','commerce.js','commerce.css','admin.js','admin.css','favicon.svg'];
const files=['index.html',...assets.map(x=>'assets/'+x),'admin/index.html','docs/product-policy.html',...fs.readdirSync(path.join(root,'shared')).filter(x=>x.endsWith('.mjs')).map(x=>'shared/'+x)];
// Resolve every active local import before publishing, including the dynamic commerce import.
const seen=new Set();function visit(rel){if(seen.has(rel))return;seen.add(rel);const code=fs.readFileSync(path.join(root,rel),'utf8');for(const m of code.matchAll(/(?:from\s+|import\s*\()['"]([^'"\n]+)['"]/g)){if(!m[1].startsWith('.'))continue;const next=path.posix.normalize(path.posix.join(path.posix.dirname(rel),m[1]));if(!files.includes(next))throw Error(`Missing public module: ${rel} -> ${next}`);visit(next);}}
visit('assets/studio.js');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const hash=createHash('sha256');
for(const rel of [...files].sort()){const bytes=fs.readFileSync(path.join(root,rel));hash.update(rel+'\0').update(bytes);fs.mkdirSync(path.dirname(path.join(out,rel)),{recursive:true});fs.writeFileSync(path.join(out,rel),bytes);}
const publicCatalog=JSON.stringify({schemaVersion:1,options:verifiedOptions(catalog)});hash.update('catalog.json\0').update(publicCatalog);fs.writeFileSync(path.join(out,'catalog.json'),publicCatalog);
let commit=process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||'';if(!commit)try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
fs.writeFileSync(path.join(out,'build-info.json'),JSON.stringify({version:'1.4.0',commit:/^[a-f0-9]{40}$/.test(commit)?commit:null,sourceDigest:hash.digest('hex')}));
console.log(`1R Studio build: ${seen.size} resolved modules; ${verifiedOptions(catalog).length} eligible product options. Browser assets only in dist/.`);
