import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {once} from 'node:events';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('real local HTTP server: public assets, API routing and private-file protection',async(t)=>{
 const token='transport-test-admin-not-production-123456';
 const child=spawn(process.execPath,['scripts/serve.mjs'],{cwd:root,env:{...process.env,HOST:'127.0.0.1',PORT:'0',COUPANG_ACCESS_KEY:'',COUPANG_SECRET_KEY:'',CATALOG_ADMIN_TOKEN:token},stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill('SIGTERM'));
 const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('local server timeout')),10000);child.stdout.on('data',buf=>{out+=buf.toString();const m=out.match(/1R: (http:\/\/[^ ]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});child.on('error',reject);child.on('exit',code=>{if(code)reject(Error('server exited '+code));});});
 for(const [path,status] of [['/',200],['/assets/planner.js',200],['/assets/commerce.js',200],['/shared/catalog.mjs',200],['/admin/',200],['/docs/product-policy.html',200],['/.env.local',404],['/.env.example',404],['/server/coupang.mjs',404],['/data/catalog.json',404],['/tests/fixtures/catalog.mjs',404]]) {
  const res=await fetch(base+path);assert.equal(res.status,status,path);
 }
 const status=await (await fetch(base+'/api/commerce?action=status')).json();assert.equal(status.connectionTested,false);assert.equal(typeof status.verifiedCount,'number');assert.ok(status.verifiedCount<=200);
 const anon=await fetch(base+'/api/commerce?action=admin-catalog');assert.equal(anon.status,401);
 const admin=await fetch(base+'/api/commerce?action=admin-catalog',{headers:{'x-1r-admin':token}});assert.equal(admin.status,200);assert.ok(Array.isArray((await admin.json()).catalog.options));
 const cross=await fetch(base+'/api/commerce?action=offer',{method:'POST',headers:{Origin:'https://foreign.example','Content-Type':'application/json'},body:JSON.stringify({optionId:'x'})});assert.equal(cross.status,403);
 const oversized=await fetch(base+'/api/commerce?action=offer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({optionId:'x'.repeat(3000)})});assert.equal(oversized.status,413);
 const publicResult=await fetch(base+'/api/commerce?action=catalog');assert.equal(publicResult.headers.get('cache-control'),'no-store');
});
